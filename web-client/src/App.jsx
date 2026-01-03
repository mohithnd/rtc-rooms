import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import CryptoJS from "crypto-js";
import JoinRoom from "./components/JoinRoom";
import ChatBox from "./components/ChatBox";
import LocalVideo from "./components/LocalVideo";
import RemoteVideos from "./components/RemoteVideos";
import Sidebar from "./components/Sidebar";
import { useRoom } from "./hooks/useRoom";

function App() {
  const { setRoomId, setJoined, setName, roomId, joined, name } = useRoom();

  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [selfId, setSelfId] = useState(null);

  const roomKeyRef = useRef(null);

  const socketRef = useRef(null);

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const [localReady, setLocalReady] = useState(false);

  const peersRef = useRef({});
  const remoteStreamsRef = useRef({});
  const [remoteUsers, setRemoteUsers] = useState([]);

  const [pendingExistingUsers, setPendingExistingUsers] = useState([]);

  const createPeerConnection = (remoteSocketId) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("webrtc-ice-candidate", {
          targetSocketId: remoteSocketId,
          data: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      remoteStreamsRef.current[remoteSocketId] = stream;
      setRemoteUsers((prev) =>
        prev.includes(remoteSocketId) ? prev : [...prev, remoteSocketId]
      );
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    peersRef.current[remoteSocketId] = pc;
    return pc;
  };

  useEffect(() => {
    if (!localReady) {
      console.log("[offer-effect] local not ready, skip");
      return;
    }
    if (!socketRef.current) {
      console.log("[offer-effect] no socket, skip");
      return;
    }
    if (pendingExistingUsers.length === 0) {
      console.log("[offer-effect] no pending users, skip");
      return;
    }

    const socket = socketRef.current;

    console.log(
      "[webrtc-offer-effect] users=",
      pendingExistingUsers,
      "localStream?",
      !!localStreamRef.current
    );

    pendingExistingUsers.forEach(async (remoteId) => {
      const pc = createPeerConnection(remoteId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("webrtc-offer", {
        targetSocketId: remoteId,
        data: offer,
      });
    });

    function clearPendingExistingUsers() {
      setPendingExistingUsers([]);
    }
    clearPendingExistingUsers();
  }, [localReady, pendingExistingUsers]);

  useEffect(() => {
    const socket = io("http://localhost:3000");
    socketRef.current = socket;

    socket.on("room-key", ({ key }) => {
      roomKeyRef.current = key;
      console.log("Room Key Received:", key);
    });

    socket.on("connect", () => {
      console.log("Socket connected. My ID:", socket.id);
      setSelfId(socket.id);
    });

    socket.on("existing-users", ({ existingUsers }) => {
      const list = existingUsers.map((u) => {
        return { id: u[0], name: u[1].name };
      });
      console.log("[existing-users]", list);
      setUsers(list);
      setPendingExistingUsers(list.map((u) => u.id));
    });

    socket.on("user-joined", ({ socketId, name }) => {
      setUsers((prev) =>
        prev.some((u) => u.id === socketId)
          ? prev
          : [...prev, { id: socketId, name }]
      );
    });

    socket.on("user-left", ({ socketId }) => {
      setUsers((prev) => prev.filter((u) => u.id !== socketId));

      const pc = peersRef.current[socketId];
      if (pc) {
        pc.close();
        delete peersRef.current[socketId];
      }

      const stream = remoteStreamsRef.current[socketId];
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        delete remoteStreamsRef.current[socketId];
      }

      setRemoteUsers((prev) => prev.filter((id) => id !== socketId));
    });

    socket.on("chat-message", (msg) => {
      if (!roomKeyRef.current) {
        return;
      }

      try {
        const bytes = CryptoJS.AES.decrypt(msg.message, roomKeyRef.current);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);

        setMessages((prev) => [...prev, { ...msg, message: decrypted }]);
      } catch (error) {
        console.error("Decrypt Failed:", error);
      }
    });

    socket.on("webrtc-offer", async ({ socketId, data }) => {
      console.log("webrtc-offer from", socketId, data);

      let pc = peersRef.current[socketId];
      if (!pc) {
        pc = createPeerConnection(socketId);
      }

      await pc.setRemoteDescription(new RTCSessionDescription(data));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("webrtc-answer", {
        targetSocketId: socketId,
        data: answer,
      });
    });

    socket.on("webrtc-answer", async ({ socketId, data }) => {
      console.log("[client] webrtc-answer from", socketId);

      const pc = peersRef.current[socketId];
      if (!pc) {
        console.warn("No peer connection for answer from", socketId);
        return;
      }

      await pc.setRemoteDescription(new RTCSessionDescription(data));
    });

    socket.on("webrtc-ice-candidate", async ({ socketId, data }) => {
      const pc = peersRef.current[socketId];
      if (!pc) {
        console.warn("No peer connection for ICE from", socketId);
        return;
      }

      if (!data) {
        return;
      }

      try {
        await pc.addIceCandidate(new RTCIceCandidate(data));
      } catch (err) {
        console.error("Error adding ICE candidate from", socketId, err);
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket Disconnected...");

      Object.values(peersRef.current).forEach((pc) => pc.close());
      peersRef.current = {};

      Object.values(remoteStreamsRef.current).forEach((stream) => {
        stream.getTracks().forEach((track) => track.stop());
      });
      remoteStreamsRef.current = {};

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }

      setUsers([]);
      setMessages([]);
      setRemoteUsers([]);
      setPendingExistingUsers([]);
      setRoomId("");
      setJoined(false);
      setLocalReady(false);
      setName("");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleJoinRoom = () => {
    if (!roomId || !name || !socketRef.current) {
      return;
    }

    socketRef.current.emit("join-room", { roomId, name });
    setJoined(true);
  };

  const handleLeaveRoom = () => {
    if (socketRef.current) {
      socketRef.current.emit("leave-room");
    }

    Object.values(peersRef.current).forEach((pc) => pc.close());
    peersRef.current = {};

    Object.values(remoteStreamsRef.current).forEach((stream) => {
      stream.getTracks().forEach((track) => track.stop());
    });
    remoteStreamsRef.current = {};

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    setUsers([]);
    setMessages([]);
    setRemoteUsers([]);
    setPendingExistingUsers([]);
    setRoomId("");
    setJoined(false);
    setLocalReady(false);
    setName("");
  };

  const handleSendChat = () => {
    if (!roomKeyRef.current || !chatInput.trim() || !socketRef.current) {
      return;
    }

    const encryptedMessage = CryptoJS.AES.encrypt(
      chatInput.trim(),
      roomKeyRef.current
    ).toString();

    socketRef.current.emit("chat-message", { message: encryptedMessage, name });
    setChatInput("");
  };

  useEffect(() => {
    if (!joined) {
      return;
    }

    async function startLocalVideo() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        localStreamRef.current = stream;
        setLocalReady(true);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
          localVideoRef.current.play();
        }
      } catch (err) {
        console.error("getUserMedia Error:", err);
      }
    }

    startLocalVideo();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
    };
  }, [joined]);

  if (!joined) {
    return <JoinRoom handleJoinRoom={handleJoinRoom} />;
  } else {
    return (
      <div
        style={{ display: "flex", height: "100vh", fontFamily: "sans-serif" }}
      >
        <Sidebar users={users} handleLeaveRoom={handleLeaveRoom} />
        <div style={{ flex: 1, padding: 12 }}>
          <ChatBox
            messages={messages}
            selfId={selfId}
            chatInput={chatInput}
            setChatInput={setChatInput}
            handleSendChat={handleSendChat}
          />
          <LocalVideo localVideoRef={localVideoRef} />
          <RemoteVideos
            remoteUsers={remoteUsers}
            users={users}
            remoteStreamsRef={remoteStreamsRef}
          />
        </div>
      </div>
    );
  }
}

export default App;

import { useEffect, useRef, useState } from "react";
import CryptoJS from "crypto-js";
import JoinRoom from "./components/JoinRoom";
import ChatBox from "./components/ChatBox";
import LocalVideo from "./components/LocalVideo";
import RemoteVideos from "./components/RemoteVideos";
import Sidebar from "./components/Sidebar";
import { useRoom } from "./hooks/useRoom";
import useSocket from "./hooks/useSocket";

function App() {
  const { setRoomId, setJoined, setName, roomId, joined, name } = useRoom();

  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [selfId, setSelfId] = useState(null);

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const [localReady, setLocalReady] = useState(false);

  const peersRef = useRef({});
  const remoteStreamsRef = useRef({});
  const [remoteUsers, setRemoteUsers] = useState([]);

  const [pendingExistingUsers, setPendingExistingUsers] = useState([]);

  const { socketRef, roomKeyRef } = useSocket({
    setSelfId,
    setUsers,
    setPendingExistingUsers,
    peersRef,
    remoteStreamsRef,
    setRemoteUsers,
    setMessages,
    createPeerConnection,
    localStreamRef,
    setName,
    setLocalReady,
    setRoomId,
    setJoined,
  });

  function createPeerConnection(remoteSocketId) {
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
  }

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

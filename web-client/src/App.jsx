import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

function App() {
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [name, setName] = useState("");

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
      setMessages((prev) => [...prev, msg]);
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
    if (!chatInput.trim() || !socketRef.current) {
      return;
    }

    socketRef.current.emit("chat-message", { message: chatInput.trim(), name });
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
    return (
      <div style={{ padding: 16 }}>
        <input
          placeholder="Enter Room ID..."
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <br />
        <input
          placeholder="Enter Name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ marginTop: 8, marginBottom: 8 }}
        />
        <br />
        <button onClick={handleJoinRoom}>Join</button>
      </div>
    );
  } else {
    return (
      <div
        style={{ display: "flex", height: "100vh", fontFamily: "sans-serif" }}
      >
        <div style={{ width: 280, borderRight: "1px solid #ccc", padding: 12 }}>
          <h3>Room: {roomId}</h3>
          <h4>Users</h4>
          <ul>
            <li>
              <strong>{name} (You)</strong>
            </li>
            {users.map((u) => (
              <li key={u.id}>{u.name}</li>
            ))}
          </ul>
          <button onClick={handleLeaveRoom}>Leave</button>
        </div>

        <div style={{ flex: 1, padding: 12 }}>
          <div style={{ marginBottom: 12 }}>
            <h4>Chat</h4>
            <div
              style={{
                border: "1px solid #ccc",
                height: 200,
                overflow: "auto",
                padding: 8,
                marginBottom: 8,
              }}
            >
              {messages.map((m, idx) => (
                <div key={idx}>
                  <span style={{ fontSize: 12, color: "#555" }}>
                    [{new Date(m.timestamp).toLocaleTimeString()}]
                  </span>{" "}
                  <strong>{m.name}</strong>: {m.message}
                </div>
              ))}
            </div>
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type A Message..."
              style={{ width: "70%", marginRight: 8 }}
            />
            <button onClick={handleSendChat}>Send</button>
          </div>
          <div>
            <h4>Video</h4>
            <div style={{ display: "inline-block", position: "relative" }}>
              <video
                ref={localVideoRef}
                style={{ width: 320, height: 240, background: "#000" }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 4,
                  left: 4,
                  padding: "2px 4px",
                  background: "rgba(0,0,0,0.6)",
                  color: "#fff",
                  fontSize: 12,
                }}
              >
                {name} (You)
              </div>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <h4>Remote Videos</h4>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {remoteUsers.map((id) => {
                const user = users.find((u) => u.id === id);

                return (
                  <div
                    key={id}
                    style={{ position: "relative", display: "inline-block" }}
                  >
                    <video
                      autoPlay
                      playsInline
                      ref={(el) => {
                        if (el && remoteStreamsRef.current[id]) {
                          el.srcObject = remoteStreamsRef.current[id];
                        }
                      }}
                      style={{
                        width: 200,
                        height: 150,
                        background: "#000",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        bottom: 4,
                        left: 4,
                        padding: "2px 4px",
                        background: "rgba(0,0,0,0.6)",
                        color: "#fff",
                        fontSize: 12,
                      }}
                    >
                      {user.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;

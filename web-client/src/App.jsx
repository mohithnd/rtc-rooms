import { useState } from "react";
import CryptoJS from "crypto-js";
import JoinRoom from "./components/JoinRoom";
import ChatBox from "./components/ChatBox";
import LocalVideo from "./components/LocalVideo";
import RemoteVideos from "./components/RemoteVideos";
import Sidebar from "./components/Sidebar";
import { useRoom } from "./hooks/useRoom";
import useSignaling from "./hooks/useSignaling";
import useLocalMedia from "./hooks/useLocalMedia";

function App() {
  const { setRoomId, setJoined, setName, roomId, joined, name } = useRoom();

  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [selfId, setSelfId] = useState(null);

  const { localVideoRef, localStreamRef, localReady, setLocalReady } =
    useLocalMedia({ joined });

  const {
    socketRef,
    roomKeyRef,
    peersRef,
    remoteStreamsRef,
    remoteUsers,
    setRemoteUsers,
    setPendingExistingUsers,
  } = useSignaling({
    setSelfId,
    setUsers,
    setMessages,
    localStreamRef,
    setName,
    setLocalReady,
    setRoomId,
    setJoined,
    localReady,
  });

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

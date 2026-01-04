import { useState } from "react";
import JoinRoom from "./components/JoinRoom";
import ChatBox from "./components/ChatBox";
import LocalVideo from "./components/LocalVideo";
import RemoteVideos from "./components/RemoteVideos";
import Sidebar from "./components/Sidebar";
import { useRoom } from "./hooks/useRoom";
import useSignaling from "./hooks/useSignaling";
import useLocalMedia from "./hooks/useLocalMedia";
import useChat from "./hooks/useChat";

function App() {
  const { setRoomId, setJoined, setName, roomId, joined, name } = useRoom();

  const [users, setUsers] = useState([]);
  const [selfId, setSelfId] = useState(null);
  const [messages, setMessages] = useState([]);

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

  const { handleSendChat, chatInput, setChatInput } = useChat({
    roomKeyRef,
    socketRef,
    name,
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

  if (!joined) {
    return <JoinRoom handleJoinRoom={handleJoinRoom} />;
  } else {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          fontFamily: "sans-serif",
          background: "#f5f5f5",
        }}
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

import { useRoom } from "../hooks/useRoom";

const JoinRoom = ({ handleJoinRoom }) => {
  const { setRoomId, setName, roomId, name } = useRoom();

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        background: "#f0f2f5",
        padding: "80px 20px 20px",
        width: "100%",
      }}
    >
      <div
        style={{
          padding: 24,
          maxWidth: 380,
          width: "100%",
          background: "#f8f9fa",
          borderRadius: 12,
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        }}
      >
        <input
          placeholder="Enter Room ID..."
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          style={{
            padding: 12,
            marginBottom: 12,
            border: "1px solid #ddd",
            borderRadius: 6,
            width: "100%",
            boxSizing: "border-box",
          }}
        />
        <input
          placeholder="Enter Name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            padding: 12,
            marginBottom: 12,
            border: "1px solid #ddd",
            borderRadius: 6,
            width: "100%",
            boxSizing: "border-box",
          }}
        />
        <button
          style={{
            padding: 12,
            background: "#28a745",
            color: "white",
            border: "none",
            borderRadius: 6,
            width: "100%",
          }}
          onClick={handleJoinRoom}
        >
          Join
        </button>
      </div>
    </div>
  );
};

export default JoinRoom;

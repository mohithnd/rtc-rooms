const JoinRoom = ({ roomId, setRoomId, name, setName, handleJoinRoom }) => {
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
};

export default JoinRoom;

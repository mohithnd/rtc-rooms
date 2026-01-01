const Sidebar = ({ roomId, name, users, handleLeaveRoom }) => {
  return (
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
  );
};

export default Sidebar;

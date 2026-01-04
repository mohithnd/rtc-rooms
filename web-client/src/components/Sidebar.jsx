import { useRoom } from "../hooks/useRoom";

const Sidebar = ({ users, handleLeaveRoom }) => {
  const { roomId, name } = useRoom();

  return (
    <div
      style={{
        width: 280,
        borderRight: "1px solid #e0e0e0",
        padding: 20,
        background: "#f8f9fa",
      }}
    >
      <h3 style={{ color: "#007bff", fontWeight: 600, marginBottom: 20 }}>
        Room: {roomId}
      </h3>
      <h4>Users</h4>
      <ul style={{ padding: 0, listStyle: "none" }}>
        <li
          style={{
            padding: 8,
            background: "#fff",
            marginBottom: 6,
            borderRadius: 4,
          }}
        >
          <strong>{name} (You)</strong>
        </li>
        {users.map((u) => (
          <li
            style={{
              padding: 8,
              background: "#fff",
              marginBottom: 6,
              borderRadius: 4,
            }}
            key={u.id}
          >
            {u.name}
          </li>
        ))}
      </ul>
      <button
        style={{
          width: "100%",
          padding: 10,
          background: "#dc3545",
          color: "white",
          border: "none",
          borderRadius: 6,
          marginTop: 20,
        }}
        onClick={handleLeaveRoom}
      >
        Leave
      </button>
    </div>
  );
};

export default Sidebar;

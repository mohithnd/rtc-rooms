const ChatBox = ({
  messages,
  selfId,
  chatInput,
  setChatInput,
  // handleSendChat,
  handleSendChatE2EE,
}) => {
  return (
    <div style={{ marginBottom: 12 }}>
      <h4>Chat</h4>
      <div
        style={{
          border: "1px solid #e0e0e0",
          height: 200,
          overflow: "auto",
          padding: 12,
          marginBottom: 12,
          background: "#f9f9f9",
          borderRadius: 8,
        }}
      >
        {messages.map((m, idx) => {
          const isSelf = selfId && m.socketId === selfId;

          const containerStyle = {
            marginBottom: 8,
            padding: 8,
            textAlign: isSelf ? "right" : "left",
          };

          const bubbleStyle = {
            display: "inline-block",
            padding: "8px 12px",
            borderRadius: 12,
            background: isSelf ? "#007bff" : "#e9ecef",
            color: isSelf ? "white" : "#333",
          };

          return (
            <div key={idx} style={containerStyle}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>
                [{new Date(m.timestamp).toLocaleTimeString()}]
              </div>
              <div style={bubbleStyle}>
                <strong>{isSelf ? "You" : m.name}</strong>: {m.message}
              </div>
            </div>
          );
        })}
      </div>
      <input
        value={chatInput}
        onChange={(e) => setChatInput(e.target.value)}
        placeholder="Type A Message..."
        style={{
          width: "70%",
          padding: 10,
          border: "1px solid #ddd",
          borderRadius: 6,
          marginRight: 8,
        }}
      />
      <button
        style={{
          padding: "10px 16px",
          background: "#007bff",
          color: "white",
          border: "none",
          borderRadius: 6,
        }}
        // onClick={handleSendChat}
        onClick={handleSendChatE2EE}
      >
        Send
      </button>
    </div>
  );
};

export default ChatBox;

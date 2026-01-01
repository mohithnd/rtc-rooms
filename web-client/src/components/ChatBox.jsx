const ChatBox = ({
  messages,
  selfId,
  chatInput,
  setChatInput,
  handleSendChat,
}) => {
  return (
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
        {messages.map((m, idx) => {
          const isSelf = selfId && m.socketId === selfId;

          const containerStyle = {
            marginBottom: 4,
            textAlign: isSelf ? "right" : "left",
          };

          const bubbleStyle = {
            display: "inline-block",
            padding: "4px 8px",
            borderRadius: 4,
            background: isSelf ? "#d1e7ff" : "#f1f1f1",
          };

          return (
            <div key={idx} style={containerStyle}>
              <div style={{ fontSize: 10, color: "#555" }}>
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
        style={{ width: "70%", marginRight: 8 }}
      />
      <button onClick={handleSendChat}>Send</button>
    </div>
  );
};

export default ChatBox;

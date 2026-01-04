const RemoteVideos = ({ remoteUsers, users, remoteStreamsRef }) => {
  return (
    <div style={{ marginTop: 16 }}>
      <h4>Remote Videos</h4>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {remoteUsers.map((id) => {
          const user = users.find((u) => u.id === id);

          return (
            <div
              key={id}
              style={{
                display: "block",
                lineHeight: 0,
                fontSize: 0,
                position: "relative",
                marginBottom: 12,
                borderRadius: 8,
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
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
                  width: 220,
                  height: 165,
                  objectFit: "cover",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 8,
                  left: 8,
                  padding: "4px 8px",
                  background: "rgba(0,0,0,0.7)",
                  color: "white",
                  borderRadius: 4,
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
  );
};

export default RemoteVideos;

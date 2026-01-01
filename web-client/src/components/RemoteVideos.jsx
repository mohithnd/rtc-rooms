const RemoteVideos = ({ remoteUsers, users, remoteStreamsRef }) => {
  return (
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
  );
};

export default RemoteVideos;

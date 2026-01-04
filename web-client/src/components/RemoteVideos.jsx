const RemoteVideos = ({ remoteUsers, users, remoteStreamsRef }) => {
  return (
    <div
      style={{
        marginTop: 16,
        flex: 1,
        minHeight: 200,
        maxHeight: "40vh",
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h4>Remote Videos</h4>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          paddingBottom: "20px",
        }}
      >
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
                  bottom: 5,
                  left: 5,
                  padding: "1px 5px",
                  background: "rgba(0,0,0,0.75)",
                  color: "#ffffff",
                  borderRadius: 8,
                  fontSize: 14,
                  lineHeight: 1.3,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
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

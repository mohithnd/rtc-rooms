const LocalVideo = ({ name, localVideoRef }) => {
  return (
    <div>
      <h4>Video</h4>
      <div style={{ display: "inline-block", position: "relative" }}>
        <video
          ref={localVideoRef}
          style={{ width: 320, height: 240, background: "#000" }}
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
          {name} (You)
        </div>
      </div>
    </div>
  );
};

export default LocalVideo;

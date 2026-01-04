import { useRoom } from "../hooks/useRoom";

const LocalVideo = ({ localVideoRef }) => {
  const { name } = useRoom();

  return (
    <div style={{ marginBottom: 20 }}>
      <h4>Video</h4>
      <div
        style={{
          display: "block",
          lineHeight: 0,
          fontSize: 0,
          position: "relative",
          borderRadius: 8,
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          width: "100%",
          maxWidth: 360,
        }}
      >
        <video
          ref={localVideoRef}
          style={{
            width: "100%",
            height: 260,
            objectFit: "cover",
            background: "#000",
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
          {name} (You)
        </div>
      </div>
    </div>
  );
};

export default LocalVideo;

import { useEffect, useRef, useState } from "react";

export default function useLocalMedia({ joined }) {
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const [localReady, setLocalReady] = useState(false);

  useEffect(() => {
    if (!joined) {
      return;
    }

    async function startLocalVideo() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        localStreamRef.current = stream;
        setLocalReady(true);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
          localVideoRef.current.play();
        }
      } catch (err) {
        console.error("getUserMedia Error:", err);
      }
    }

    startLocalVideo();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
    };
  }, [joined]);

  return {
    localVideoRef,
    localStreamRef,
    localReady,
    setLocalReady,
  };
}

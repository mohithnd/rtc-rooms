import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import CryptoJS from "crypto-js";

export default function useSocket({
  setSelfId,
  setUsers,
  setPendingExistingUsers,
  peersRef,
  remoteStreamsRef,
  setRemoteUsers,
  setMessages,
  createPeerConnection,
  localStreamRef,
  setName,
  setLocalReady,
  setRoomId,
  setJoined,
}) {
  const roomKeyRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io("http://localhost:3000");
    socketRef.current = socket;

    socket.on("room-key", ({ key }) => {
      roomKeyRef.current = key;
      console.log("Room Key Received:", key);
    });

    socket.on("connect", () => {
      console.log("Socket connected. My ID:", socket.id);
      setSelfId(socket.id);
    });

    socket.on("existing-users", ({ existingUsers }) => {
      const list = existingUsers.map((u) => {
        return { id: u[0], name: u[1].name };
      });
      console.log("[existing-users]", list);
      setUsers(list);
      setPendingExistingUsers(list.map((u) => u.id));
    });

    socket.on("user-joined", ({ socketId, name }) => {
      setUsers((prev) =>
        prev.some((u) => u.id === socketId)
          ? prev
          : [...prev, { id: socketId, name }]
      );
    });

    socket.on("user-left", ({ socketId }) => {
      setUsers((prev) => prev.filter((u) => u.id !== socketId));

      const pc = peersRef.current[socketId];
      if (pc) {
        pc.close();
        delete peersRef.current[socketId];
      }

      const stream = remoteStreamsRef.current[socketId];
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        delete remoteStreamsRef.current[socketId];
      }

      setRemoteUsers((prev) => prev.filter((id) => id !== socketId));
    });

    socket.on("chat-message", (msg) => {
      if (!roomKeyRef.current) {
        return;
      }

      try {
        const bytes = CryptoJS.AES.decrypt(msg.message, roomKeyRef.current);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);

        setMessages((prev) => [...prev, { ...msg, message: decrypted }]);
      } catch (error) {
        console.error("Decrypt Failed:", error);
      }
    });

    socket.on("webrtc-offer", async ({ socketId, data }) => {
      console.log("webrtc-offer from", socketId, data);

      let pc = peersRef.current[socketId];
      if (!pc) {
        pc = createPeerConnection(socketId);
      }

      await pc.setRemoteDescription(new RTCSessionDescription(data));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("webrtc-answer", {
        targetSocketId: socketId,
        data: answer,
      });
    });

    socket.on("webrtc-answer", async ({ socketId, data }) => {
      console.log("[client] webrtc-answer from", socketId);

      const pc = peersRef.current[socketId];
      if (!pc) {
        console.warn("No peer connection for answer from", socketId);
        return;
      }

      await pc.setRemoteDescription(new RTCSessionDescription(data));
    });

    socket.on("webrtc-ice-candidate", async ({ socketId, data }) => {
      const pc = peersRef.current[socketId];
      if (!pc) {
        console.warn("No peer connection for ICE from", socketId);
        return;
      }

      if (!data) {
        return;
      }

      try {
        await pc.addIceCandidate(new RTCIceCandidate(data));
      } catch (err) {
        console.error("Error adding ICE candidate from", socketId, err);
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket Disconnected...");

      Object.values(peersRef.current).forEach((pc) => pc.close());
      peersRef.current = {};

      Object.values(remoteStreamsRef.current).forEach((stream) => {
        stream.getTracks().forEach((track) => track.stop());
      });
      remoteStreamsRef.current = {};

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }

      setUsers([]);
      setMessages([]);
      setRemoteUsers([]);
      setPendingExistingUsers([]);
      setRoomId("");
      setJoined(false);
      setLocalReady(false);
      setName("");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { socketRef, roomKeyRef };
}

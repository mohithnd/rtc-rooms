import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import CryptoJS from "crypto-js";

export default function useSignaling({
  setSelfId,
  setUsers,
  setMessages,
  localStreamRef,
  setName,
  setLocalReady,
  setRoomId,
  setJoined,
  localReady,
  publicKeysRef,
  keyPairRef,
  elliptic,
  sharedSecretsRef,
  joined,
}) {
  const roomKeyRef = useRef(null);
  const socketRef = useRef(null);

  const peersRef = useRef({});
  const remoteStreamsRef = useRef({});
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [pendingExistingUsers, setPendingExistingUsers] = useState([]);

  function createPeerConnection(remoteSocketId) {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("webrtc-ice-candidate", {
          targetSocketId: remoteSocketId,
          data: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      remoteStreamsRef.current[remoteSocketId] = stream;
      setRemoteUsers((prev) =>
        prev.includes(remoteSocketId) ? prev : [...prev, remoteSocketId]
      );
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    peersRef.current[remoteSocketId] = pc;
    return pc;
  }

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

    socket.on("e2ee-public-key", ({ socketId, publicKey }) => {
      console.log("[E2EE] Received Public Key From", socketId);

      publicKeysRef.current.set(socketId, publicKey);

      if (keyPairRef.current) {
        const otherPublicKey = elliptic.keyFromPublic(publicKey, "hex");
        const sharedSecret = keyPairRef.current.derive(
          otherPublicKey.getPublic()
        );

        const sharedHex = sharedSecret.toString(16);
        const AESKey = CryptoJS.SHA256(sharedHex).toString();

        sharedSecretsRef.current.set(socketId, AESKey);
        console.log(`[E2EE] Shared Secret Ready With ${socketId}`);
      }
    });

    socket.on("e2ee-chat-message", ({ socketId, message, timestamp, name }) => {
      try {
        const AESKey = sharedSecretsRef.current.get(socketId);
        if (!AESKey) {
          console.warn("[E2EE] No Shared Secret For", socketId);
          return;
        }

        const bytes = CryptoJS.AES.decrypt(message, AESKey);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);

        setMessages((prev) => [
          ...prev,
          { socketId, message: decrypted, timestamp, name },
        ]);

        console.log(`[E2EE] Decrypted From ${socketId}: "${decrypted}"`);
      } catch (err) {
        console.error("[E2EE Decrypt Failed:", err);
      }
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

      publicKeysRef.current.delete(socketId);
      sharedSecretsRef.current.delete(socketId);
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

      sharedSecretsRef.current.clear();
      publicKeysRef.current.clear();
      keyPairRef.current = null;

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

  useEffect(() => {
    if (!localReady) {
      console.log("[offer-effect] local not ready, skip");
      return;
    }
    if (!socketRef.current) {
      console.log("[offer-effect] no socket, skip");
      return;
    }
    if (pendingExistingUsers.length === 0) {
      console.log("[offer-effect] no pending users, skip");
      return;
    }

    const socket = socketRef.current;

    console.log(
      "[webrtc-offer-effect] users=",
      pendingExistingUsers,
      "localStream?",
      !!localStreamRef.current
    );

    pendingExistingUsers.forEach(async (remoteId) => {
      const pc = createPeerConnection(remoteId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("webrtc-offer", {
        targetSocketId: remoteId,
        data: offer,
      });
    });

    function clearPendingExistingUsers() {
      setPendingExistingUsers([]);
    }
    clearPendingExistingUsers();
  }, [localReady, pendingExistingUsers]);

  function keyRotation() {
    console.log("🔄 [Key Rotation] Every 5min");

    const keyPair = elliptic.genKeyPair();
    keyPairRef.current = keyPair;
    console.log("[E2EE] Generated ECDH Key Pair.");

    socketRef.current.emit("e2ee-public-key", {
      publicKey: keyPair.getPublic("hex"),
    });

    console.log("🔑 Rotation complete");
  }

  useEffect(() => {
    if (joined && socketRef.current) {
      const interval = setInterval(keyRotation, 5 * 60 * 1000);
      return () => {
        clearInterval(interval);
      };
    }
  }, [joined]);

  const encryptMessage = (targetSocketId, message) => {
    const AESKey = sharedSecretsRef.current.get(targetSocketId);
    if (!AESKey) {
      console.warn("[E2EE] No Shared Secret For", targetSocketId);
      return;
    }

    return CryptoJS.AES.encrypt(message, AESKey).toString();
  };

  return {
    socketRef,
    roomKeyRef,
    peersRef,
    remoteStreamsRef,
    remoteUsers,
    setRemoteUsers,
    pendingExistingUsers,
    setPendingExistingUsers,
    encryptMessage,
  };
}

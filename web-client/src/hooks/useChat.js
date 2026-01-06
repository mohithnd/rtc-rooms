import { useState } from "react";
import CryptoJS from "crypto-js";

export default function useChat({
  roomKeyRef,
  socketRef,
  name,
  encryptMessage,
  users,
  setMessages,
}) {
  const [chatInput, setChatInput] = useState("");

  const handleSendChat = () => {
    if (!roomKeyRef.current || !chatInput.trim() || !socketRef.current) {
      return;
    }

    const encryptedMessage = CryptoJS.AES.encrypt(
      chatInput.trim(),
      roomKeyRef.current
    ).toString();

    socketRef.current.emit("chat-message", { message: encryptedMessage, name });
    setChatInput("");
  };

  const handleSendChatE2EE = () => {
    if (!roomKeyRef.current || !chatInput.trim() || !socketRef.current) {
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        socketId: socketRef.current.id,
        message: chatInput.trim(),
        timestamp: Date.now(),
        name,
      },
    ]);

    users.forEach((user) => {
      try {
        const encrypted = encryptMessage(user.id, chatInput.trim());

        socketRef.current.emit("e2ee-chat-message", {
          targetSocketId: user.id,
          message: encrypted,
          name,
        });
        setChatInput("");
      } catch (err) {
        console.error("[E2EE] Encrypt failed:", err);
      }
    });
  };

  return { handleSendChat, chatInput, setChatInput, handleSendChatE2EE };
}

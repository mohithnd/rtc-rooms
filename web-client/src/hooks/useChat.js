import { useState } from "react";
import CryptoJS from "crypto-js";

export default function useChat({ roomKeyRef, socketRef, name }) {
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

  return { handleSendChat, chatInput, setChatInput };
}

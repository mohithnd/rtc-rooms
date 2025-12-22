function handleChatMessage(io, socket, payload) {
  let data = payload;

  if (typeof payload === "string") {
    try {
      data = JSON.parse(payload);
    } catch (error) {
      console.log(`[chat] invalid JSON payload`);
      return;
    }
  }

  if (!data || typeof data.message !== "string") {
    return;
  }

  const roomId = socket.data.roomId;
  if (!roomId) {
    return;
  }

  io.to(roomId).emit("chat-message", {
    socketId: socket.id,
    message: data.message,
    timestamp: Date.now(),
  });

  console.log(
    `[chat] room=${roomId} socket=${socket.id} message=${data.message}`
  );
}

module.exports = { handleChatMessage };

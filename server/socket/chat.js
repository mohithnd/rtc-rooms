function handleChatMessage(io, socket, message, name) {
  if (!message || !name) {
    return;
  }

  const roomId = socket.data.roomId;
  if (!roomId) {
    return;
  }

  io.to(roomId).emit("chat-message", {
    socketId: socket.id,
    message,
    timestamp: Date.now(),
    name,
  });

  console.log(
    `[chat] room=${roomId} socket=${socket.id} name=${name} message=${message}`
  );
}

module.exports = { handleChatMessage };

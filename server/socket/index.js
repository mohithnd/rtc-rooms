const { handleChatMessage } = require("./chat");
const { handleJoinRoom, handleLeaveRoom } = require("./handlers");
const { handleOffer, handleAnswer, handleIceCandidate } = require("./webrtc");

function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log(`[socket-connected] socket=${socket.id}`);

    socket.on("join-room", ({ roomId, name }) => {
      if (socket.data.roomId) {
        handleLeaveRoom(io, socket);
      }
      socket.data.roomId = roomId;
      handleJoinRoom(io, socket, name);
    });

    socket.on("leave-room", () => {
      handleLeaveRoom(io, socket);
    });

    socket.on("disconnect", (reason) => {
      console.log(`[socket-disconnected] socket=${socket.id} reason=${reason}`);
      handleLeaveRoom(io, socket);
    });

    socket.on("chat-message", ({ message, name }) => {
      handleChatMessage(io, socket, message, name);
    });

    socket.on("webrtc-offer", (payload) => {
      handleOffer(io, socket, payload);
    });

    socket.on("webrtc-answer", (payload) => {
      handleAnswer(io, socket, payload);
    });

    socket.on("webrtc-ice-candidate", (payload) => {
      handleIceCandidate(io, socket, payload);
    });
  });
}

module.exports = { registerSocketHandlers };

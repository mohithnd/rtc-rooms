const {
  handleE2EEChatMessage,
  handlePublicKeyExchange,
  handleE2EEDisconnect,
} = require("../e2ee/handlers");
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
      handleE2EEDisconnect(io, socket);
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

    socket.on("e2ee-public-key", ({ publicKey }) => {
      handlePublicKeyExchange(io, socket, publicKey);
    });

    socket.on("e2ee-chat-message", ({ message, name, targetSocketId }) => {
      handleE2EEChatMessage(io, socket, message, name, targetSocketId);
    });
  });
}

module.exports = { registerSocketHandlers };

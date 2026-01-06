const { getUsersInRoom, isSocketInRoom } = require("../rooms/store");
const { removePublicKey, addPublicKey, getPublicKey } = require("./store");

const handlePublicKeyExchange = (io, socket, publicKey) => {
  const roomId = socket.data.roomId;

  if (!roomId) {
    console.log(`[E2EE] No-Room socket=${socket.id}`);
    return;
  }

  addPublicKey(socket.id, publicKey);
  console.log(
    `[E2EE] room=${roomId} socket=${socket.id} publicKey=${publicKey}`
  );

  getUsersInRoom(roomId).forEach(([memberId]) => {
    if (memberId != socket.id) {
      socket.emit("e2ee-public-key", {
        socketId: memberId,
        publicKey: getPublicKey(memberId),
      });
    }
  });

  socket.to(roomId).emit("e2ee-public-key", {
    socketId: socket.id,
    publicKey: publicKey,
  });
};

const handleE2EEChatMessage = (
  io,
  socket,
  encryptedMessage,
  name,
  targetSocketId
) => {
  if (!encryptedMessage || !name || !targetSocketId) {
    return;
  }

  const roomId = socket.data.roomId;
  if (!roomId) {
    return;
  }

  if (!isSocketInRoom(roomId, targetSocketId)) {
    console.log(`[E2EE] socket=${targetSocketId} Not In room=${roomId}`);
    return;
  }

  io.to(targetSocketId).emit("e2ee-chat-message", {
    socketId: socket.id,
    message: encryptedMessage,
    timestamp: Date.now(),
    name,
  });

  console.log(
    `[E2EE] room=${roomId} from=${socket.id} to=${targetSocketId} message=${encryptedMessage}`
  );
};

const handleE2EEDisconnect = (io, socket) => {
  removePublicKey(socket.id);
  console.log(`[E2EE] Disconnect socket=${socket.id}`);
};

module.exports = {
  handlePublicKeyExchange,
  handleE2EEChatMessage,
  handleE2EEDisconnect,
};

const {
  addUserToRoom,
  getUsersInRoom,
  removeUser,
  isRoomKeyExists,
  setRoomKey,
  getRoomKey,
} = require("../rooms/store");
const crypto = require("node:crypto");

function handleJoinRoom(io, socket, name) {
  if (!isRoomKeyExists(socket.data.roomId)) {
    setRoomKey(socket.data.roomId, crypto.randomBytes(32));
    console.log(
      `[room-key] room=${socket.data.roomId} key=${getRoomKey(
        socket.data.roomId
      ).toString("base64")}`
    );
  }

  socket.emit("room-key", {
    roomId: socket.data.roomId,
    key: getRoomKey(socket.data.roomId).toString("base64"),
  });

  const existingUsers = getUsersInRoom(socket.data.roomId);
  socket.emit("existing-users", { existingUsers });

  addUserToRoom(socket.data.roomId, socket.id, name);

  socket.join(socket.data.roomId);

  socket
    .to(socket.data.roomId)
    .emit("user-joined", { socketId: socket.id, name });

  console.log(
    `[join-room] room=${socket.data.roomId} socket=${
      socket.id
    } name=${name} users=${existingUsers.length + 1}`
  );
}

function handleLeaveRoom(io, socket) {
  const roomId = socket.data.roomId;
  if (!roomId) {
    return;
  }

  removeUser(roomId, socket.id);

  socket.leave(roomId);
  socket.to(roomId).emit("user-left", { socketId: socket.id });

  console.log(`[leave-room] room=${roomId} socket=${socket.id}`);

  socket.data.roomId = null;
}

module.exports = { handleJoinRoom, handleLeaveRoom };

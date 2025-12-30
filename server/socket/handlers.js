const { addUserToRoom, getUsersInRoom, removeUser } = require("../rooms/store");

function handleJoinRoom(io, socket, name) {
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

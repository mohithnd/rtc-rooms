const rooms = new Map();

function getUsersInRoom(roomId) {
  const room = rooms.get(roomId);
  if (room) {
    return Array.from(room.entries());
  } else {
    return [];
  }
}

function removeUser(roomId, socketId) {
  const room = rooms.get(roomId);
  if (room) {
    room.delete(socketId);
    if (room.size === 0) {
      rooms.delete(roomId);
    }
  }
}

function addUserToRoom(roomId, socketId, name) {
  const room = rooms.get(roomId);
  if (room) {
    room.set(socketId, { name, audio: true, video: true });
  } else {
    const newRoom = new Map();
    newRoom.set(socketId, { name, audio: true, video: true });
    rooms.set(roomId, newRoom);
  }
}

function isSocketInRoom(roomId, socketId) {
  const room = rooms.get(roomId);
  if (!room) {
    return false;
  }
  return room.has(socketId);
}

module.exports = {
  getUsersInRoom,
  removeUser,
  addUserToRoom,
  isSocketInRoom,
};

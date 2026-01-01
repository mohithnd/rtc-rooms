const rooms = new Map();
const roomKeys = new Map();

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
      roomKeys.delete(roomId);
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

function isRoomKeyExists(roomId) {
  return roomKeys.has(roomId);
}

function getRoomKey(roomId) {
  return roomKeys.get(roomId);
}

function setRoomKey(roomId, key) {
  roomKeys.set(roomId, key);
}

module.exports = {
  getUsersInRoom,
  removeUser,
  addUserToRoom,
  isSocketInRoom,
  isRoomKeyExists,
  getRoomKey,
  setRoomKey,
};

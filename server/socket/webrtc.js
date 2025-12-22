const { isSocketInRoom } = require("../rooms/store");

function handleOffer(io, socket, payload) {
  let data = payload;

  if (typeof payload === "string") {
    try {
      data = JSON.parse(payload);
    } catch (error) {
      console.log(`[webrtc-offer] invalid JSON payload`);
      return;
    }
  }

  if (
    !data ||
    typeof data.targetSocketId !== "string" ||
    typeof data.data !== "object"
  ) {
    return;
  }

  const roomId = socket.data.roomId;
  if (!roomId) {
    return;
  }

  const res = isSocketInRoom(roomId, data.targetSocketId);
  if (!res) {
    return;
  }

  io.to(data.targetSocketId).emit("webrtc-offer", {
    socketId: socket.id,
    data: data.data,
  });
  console.log(
    `[webrtc-offer] room=${roomId} socket=${socket.id} targetSocket=${data.targetSocketId}`
  );
}

function handleAnswer(io, socket, payload) {
  let data = payload;

  if (typeof payload === "string") {
    try {
      data = JSON.parse(payload);
    } catch (error) {
      console.log(`[webrtc-answer] invalid JSON payload`);
      return;
    }
  }

  if (
    !data ||
    typeof data.targetSocketId !== "string" ||
    typeof data.data !== "object"
  ) {
    return;
  }

  const roomId = socket.data.roomId;
  if (!roomId) {
    return;
  }

  const res = isSocketInRoom(roomId, data.targetSocketId);
  if (!res) {
    return;
  }

  io.to(data.targetSocketId).emit("webrtc-answer", {
    socketId: socket.id,
    data: data.data,
  });
  console.log(
    `[webrtc-answer] room=${roomId} socket=${socket.id} targetSocket=${data.targetSocketId}`
  );
}

function handleIceCandidate(io, socket, payload) {
  let data = payload;

  if (typeof payload === "string") {
    try {
      data = JSON.parse(payload);
    } catch (error) {
      console.log(`[webrtc-ice-candidate] invalid JSON payload`);
      return;
    }
  }

  if (!data || typeof data.targetSocketId !== "string" || !("data" in data)) {
    return;
  }

  const roomId = socket.data.roomId;
  if (!roomId) {
    return;
  }

  const res = isSocketInRoom(roomId, data.targetSocketId);
  if (!res) {
    return;
  }

  io.to(data.targetSocketId).emit("webrtc-ice-candidate", {
    socketId: socket.id,
    data: data.data,
  });
  console.log(
    `[webrtc-ice-candidate] room=${roomId} socket=${socket.id} targetSocket=${data.targetSocketId}`
  );
}

module.exports = {
  handleOffer,
  handleAnswer,
  handleIceCandidate,
};

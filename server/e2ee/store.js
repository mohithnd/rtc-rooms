const publicKeys = new Map();

const addPublicKey = (socketId, publicKey) => {
  publicKeys.set(socketId, publicKey);
};

const getPublicKey = (socketId) => {
  return publicKeys.get(socketId);
};

const removePublicKey = (socketId) => {
  publicKeys.delete(socketId);
};

module.exports = {
  addPublicKey,
  removePublicKey,
  getPublicKey,
};

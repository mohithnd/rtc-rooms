const express = require("express");
const http = require("node:http");
const { Server } = require("socket.io");
const { registerSocketHandlers } = require("./socket");

function startServer() {
  const app = express();

  const httpServer = http.createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: "*",
    },
  });
  registerSocketHandlers(io);

  const PORT = 3000;

  httpServer.listen(PORT, () => {
    console.log(`[server-start] port=${PORT} env=development`);
  });
}

startServer();

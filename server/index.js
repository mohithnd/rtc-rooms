const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const http = require("node:http");
const { Server } = require("socket.io");
const { registerSocketHandlers } = require("./socket");
const { PORT, NODE_ENV, CORS_ORIGINS } = require("./config");

function startServer() {
  const app = express();

  const httpServer = http.createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: NODE_ENV === "prod" ? CORS_ORIGINS : "*",
      methods: ["GET", "POST"],
    },
  });
  registerSocketHandlers(io);

  httpServer.listen(PORT, () => {
    console.log(`[server-start] port=${PORT} env=${NODE_ENV}`);
  });
}

startServer();

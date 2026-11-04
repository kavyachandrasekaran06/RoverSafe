const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const { Server } = require("socket.io");

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "RoverSafe Backend Running Successfully!",
    status: "Online",
  });
});

// API health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "RoverSafe API is working",
  });
});

// Socket connection
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`RoverSafe server running on port ${PORT}`);
});
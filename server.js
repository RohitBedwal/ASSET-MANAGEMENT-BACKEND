// Core dependencies
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import http from "http"; // ⭐ Required for Socket.IO

// Custom modules
import connectDB from './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import categoryRoutes from "./src/routes/categoryRoutes.js";
import deviceRoutes from "./src/routes/deviceRoutes.js";
import vendorRoutes from "./src/routes/vendorRoutes.js";
import notificationRoutes from "./src/routes/notificationRoutes.js";

import { Server } from "socket.io"; // ⭐ Socket.IO

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express
const app = express();
const server = http.createServer(app); // ⭐ Replace app.listen()

// CORS Configuration
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://assetsmanagement.onrender.com",
    process.env.FRONTEND_URL
  ],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));

// ⭐ Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://assetsmanagement.onrender.com"
    ],
    methods: ["GET", "POST"]
  }
});

// 🔌 Log connections
io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// Export io for controllers
export { io };

// Root route
app.get("/", (req, res) => {
  res.json({ success: true, message: "API Running with Socket.IO" });
});

// Health Check
app.get("/health", (req, res) => {
  res.json({ status: "OK", ts: new Date() });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/notifications", notificationRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ⭐ Global error handler (correct signature)
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.message);
  res.status(500).json({ message: err.message });
});

// Start Server ⭐ Use server.listen!
const PORT = process.env.PORT || 4000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});

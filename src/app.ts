import express from "express";
import http from "http";
import { PrismaClient } from "@prisma/client";
import { Server } from "socket.io";
import { SocketAuthService } from "./services/SocketAuthService";
import { SocketEventHandler } from "./services/SocketEventHandler";
import NotificationService from "./services/NotificationService";

const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Your frontend URL
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.get("/notifications", async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" }
    });
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Initialize services
const notificationService = new NotificationService(io);
const socketAuthService = new SocketAuthService(prisma);
const socketEventHandler = new SocketEventHandler(notificationService);

// Socket.IO Authentication
io.use((socket, next) => socketAuthService.authenticate(socket, next));


io.on("connection", (socket) => {
  socketEventHandler.handleConnection(socket);


  socket.on("get-notifications", (callback) =>
    socketEventHandler.handleGetNotifications(socket, callback));

  socket.on("mark-as-read", (notificationId, callback) =>
    socketEventHandler.handleMarkAsRead(socket, notificationId, callback));

  socket.on("mark-all-read", (callback) =>
    socketEventHandler.handleMarkAllAsRead(socket, callback));

  socket.on("send-admin-notification", (data) =>
    socketEventHandler.handleAdminNotification(socket, data));

  // Issue-related notifications
  socket.on("issue-created", (data) =>
    socketEventHandler.handleIssueCreationNotification(data));

  socket.on("issue-approved", (data) =>
    socketEventHandler.handleIssueApprovalNotification(data));

  // Add other issue-related events...

  socket.on("disconnect", () =>
    socketEventHandler.handleDisconnect(socket));
});

// Prisma graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start Server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// server.ts
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";
import NotificationService from "./services/NotificationService";
import { ClientToServerEvents } from "./types/event";
const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();


interface ServerToClientEvents {
  'new-notification': (notification: any) => void;
}



interface InterServerEvents { }
interface SocketData {
  user: { id: string; name: string; role: number };
}

const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"],
    credentials: true,
  }
});

const notificationService = new NotificationService(io);

// --- Authenticate Socket Connections ---
io.use(async (socket, next) => {
  const userId = socket.handshake.auth.userId;
  if (!userId) {
    return next(new Error("Authentication error"));
  }


  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, name: true }
    });

    if (!user) {
      return next(new Error("User not found"));
    }

    // Attach user to socket
    socket.data.user = user as any;
    console.log(socket.data.user)
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    next(new Error("Authentication error"));
  }
});


io.on("connection", (socket) => {
  const user = socket.data.user;


  socket.join(`user-${user.id}`);
  if (user.role === 1) socket.join("admin-room");
  if (user.role === 2) socket.join("developer-room");



  socket.on("get-notifications", async (callback) => {
    try {
      const notifications = await notificationService.getUserNotifications(user.id);
      callback({ success: true, notifications });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      callback({ success: false, error: "Failed to fetch notifications" });
    }
  });

  socket.on("mark-as-read", async (notificationId, callback) => {
    try {
      const notification = await notificationService.markAsRead(user.id, notificationId);
      if (!notification) {
        return callback({ success: false, error: "Notification not found" });
      }

      callback({ success: true, });
    } catch (error) {
      console.error('Error marking as read:', error);
      callback({ success: false, error: "Failed to mark as read" });
    }
  });

  socket.on("mark-all-read", async (callback) => {
    try {
      const notification = await notificationService.markAllAsRead(user.id);
      if (!notification) {
        return callback({ success: false, error: "No notifications to mark as read" });
      }
      callback({ success: true });
    } catch (error) {
      console.error('Error marking all as read:', error);
      callback({ success: false, error: "Failed to mark all as read" });
    }
  });

  socket.on("send-admin-notification", async (data) => {
    try {
      const { message, type, userId } = data;
      const notification = await notificationService.createNotification({
        userId,
        title: "Admin Notification",
        message,
        senderId: user.id,
        issueId: null, // Assuming no issueId for admin notifications
        createdAt: new Date(),
        type,
        read: false
      });


    } catch (error) {
      console.error('Error sending admin notification:', error);
    }
  });





  socket.on("disconnect", () => {
    console.log(`User disconnected: ${user.name}`);
  });
});

// --- Prisma graceful shutdown ---
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});

// --- Start Server ---
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

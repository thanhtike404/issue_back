import express from "express";
import http from "http";
import { PrismaClient, Prisma } from "@prisma/client";
import { Request, Response } from "express";
import { Server } from "socket.io";
import { SocketAuthService } from "./services/SocketAuthService";
import { SocketEventHandler } from "./services/SocketEventHandler";
import NotificationService from "./services/NotificationService";
import ChatService from "./services/chatService";
import { Webhook } from 'svix';

import { WebhookEvent } from '@clerk/clerk-sdk-node';
const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});
const notificationService = new NotificationService(io);
const socketAuthService = new SocketAuthService(prisma);
const chatService=new ChatService(io);

const socketEventHandler = new SocketEventHandler(notificationService,io);

// async function testDatabaseConnection() {
//   try {
//     const user = await prisma.user.findFirst(); // Adjust with any model you have in your schema
 
//     console.log("Database connection is successful. Test user:", user);
    
//   } catch (error) {
//     console.error("Error connecting to the database:", error);
//   }
// }

// testDatabaseConnection();

// Log Prisma queries with proper typing
//@ts-ignoreuseConnectedUserStore
prisma.$on('query', (event: Prisma.QueryEvent) => {
  console.log('Query:', event.query);
  console.log('Params:', event.params);
  console.log('Duration:', event.duration);
});

// Notifications route
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
app.post(
  '/api/webhooks/clerk',
  express.raw({ type: 'application/json' }),
  // @ts-ignore
  async (req: Request, res: Response) => {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    try {
      // Verify webhook signature
      const wh = new Webhook(WEBHOOK_SECRET);
      const payload = req.body.toString();
      const headers = req.headers;
      
      const evt = wh.verify(payload, {
        'svix-id': headers['svix-id'] as string,
        'svix-timestamp': headers['svix-timestamp'] as string,
        'svix-signature': headers['svix-signature'] as string,
      }) as WebhookEvent;

      // Handle user.created event
      if (evt.type === 'user.created') {
        const userData = evt.data;
        const primaryEmail = userData.email_addresses.find(
          (email: any) => email.id === userData.primary_email_address_id
        );

        // Create user in your database
        await prisma.user.create({
          data: {
            clerkId: userData.id,
            email: primaryEmail?.email_address,
            name: `${userData.first_name} ${userData.last_name}`.trim(),
            image: userData.image_url,
           
            role: 0,
            password: '',
          }
        });

        console.log(`Created user ${userData.id} in database`);
      }

      return res.status(200).json({ success: true });

    } catch (err) {
      console.error('Webhook error:', err);
      return res.status(400).json({ error: 'Invalid webhook' });
    }
  }
);



io.use((socket, next) => socketAuthService.authenticate(socket, next));



io.on("connection", (socket) => {
  

  socketEventHandler.handleConnection(socket);



  socketEventHandler.handleGetConnectedUsers(socket, (users:any) => {
    socket.emit("update-connected-users", users);
  });
  

  socket.on('get-user-chat', (data, callback) => chatService.getUserChats(data, callback));
  socket.on('send-message', (data, callback) => chatService.sendMessage(socket, data, callback));
  socket.on('create-chat', (data, callback) => chatService.createChat(socket, data, callback));
  socket.on('get-chat-messages', (data, callback) => chatService.getChatMessages(socket, data, callback));
  socket.on('update-message', (data, callback) => chatService.updateMessage(socket, data, callback));
  socket.on('delete-message', (data, callback) => chatService.deleteMessage(socket, data, callback));
  socket.on('get-unread-count', (callback) => chatService.getUnreadCount(socket, callback));
  socket.on('join-chat', (data, callback) => chatService.joinChat(socket, data, callback));
  socket.on('leave-chat', (data, callback) => chatService.leaveChat(socket, data, callback));


  socket.on("get-connected-users", (callback) =>
     socketEventHandler.handleGetConnectedUsers(socket, callback));
  socket.on("get-notifications", (callback) =>
    socketEventHandler.handleGetNotifications(socket, callback));

  socket.on("mark-as-read", (notificationId, callback) =>
    socketEventHandler.handleMarkAsRead(socket, notificationId, callback));

  socket.on("mark-all-read", (callback) =>
    socketEventHandler.handleMarkAllAsRead(socket, callback));

  socket.on("send-admin-notification", (data) =>
    socketEventHandler.handleAdminNotification(socket, data));

  socket.on("issue-created", (data) =>
    socketEventHandler.handleIssueCreationNotification(data));

  socket.on("issue-approved", (data) =>
    socketEventHandler.handleIssueApprovalNotification(data));

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
const PORT = Number(process.env.PORT) || 4000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

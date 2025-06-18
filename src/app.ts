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
// import { Request } from "express";
// CORRECT IMPORT for a Node.js / Express backend
import { WebhookEvent } from '@clerk/clerk-sdk-node';
const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Your frontend URL
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Test the database connection
async function testDatabaseConnection() {
  try {
    const user = await prisma.user.findFirst(); // Adjust with any model you have in your schema
 
    console.log("Database connection is successful. Test user:", user);
    
  } catch (error) {
    console.error("Error connecting to the database:", error);
  }
}

testDatabaseConnection();

// Log Prisma queries with proper typing
//@ts-ignore
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
  '/api/webhooks/user/registered',
  express.raw({ type: 'application/json' }),
  // @ts-ignore
  async (req:Request,res:Response) => {
    const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
    if (!WEBHOOK_SECRET) {
      console.error('❌ WEBHOOK_SECRET is not set in environment variables.');
      return res.status(500).send('Internal Server Error: Webhook secret not configured.');
    }

    // Verification logic using Svix (remains exactly the same)
    const headers = req.headers;
    const svix_id = headers['svix-id'] as string;
    const svix_timestamp = headers['svix-timestamp'] as string;
    const svix_signature = headers['svix-signature'] as string;

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return res.status(400).json({ success: false, message: 'Error: Missing Svix headers.' });
    }

    const body = req.body.toString();
    const wh = new Webhook(WEBHOOK_SECRET);
    let evt: WebhookEvent; // This type now comes from the correct package

    try {
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as WebhookEvent;
    } catch (err: any) {
      console.error('❌ Error verifying webhook signature:', err.message);
      return res.status(400).json({ success: false, message: 'Error: Invalid signature.' });
    }

    // Processing logic (remains exactly the same)
    const eventType = evt.type;
    if (eventType === 'user.created') {
      // ... your logic to create a notification
    }

    return res.status(200).json({ success: true, message: 'Webhook processed.' });
  }
);
// Initialize services
const notificationService = new NotificationService(io);
const socketAuthService = new SocketAuthService(prisma);
const chatService=new ChatService(io);

const socketEventHandler = new SocketEventHandler(notificationService,io);

// Socket.IO Authentication
io.use((socket, next) => socketAuthService.authenticate(socket, next));



io.on("connection", (socket) => {
  

  socketEventHandler.handleConnection(socket);
  socket.on('get-user-chat',(data,callback)=>chatService.getUserChats(data,callback));

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

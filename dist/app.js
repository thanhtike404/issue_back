"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const client_1 = require("@prisma/client");
const socket_io_1 = require("socket.io");
const SocketAuthService_1 = require("./services/SocketAuthService");
const SocketEventHandler_1 = require("./services/SocketEventHandler");
const NotificationService_1 = __importDefault(require("./services/NotificationService"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const prisma = new client_1.PrismaClient();
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "http://localhost:3000", // Your frontend URL
        methods: ["GET", "POST"],
        credentials: true
    }
});
// Initialize services
const notificationService = new NotificationService_1.default(io);
const socketAuthService = new SocketAuthService_1.SocketAuthService(prisma);
const socketEventHandler = new SocketEventHandler_1.SocketEventHandler(notificationService);
// Socket.IO Authentication
io.use((socket, next) => socketAuthService.authenticate(socket, next));
io.on("connection", (socket) => {
    socketEventHandler.handleConnection(socket);
    socket.on("get-notifications", (callback) => socketEventHandler.handleGetNotifications(socket, callback));
    socket.on("mark-as-read", (notificationId, callback) => socketEventHandler.handleMarkAsRead(socket, notificationId, callback));
    socket.on("mark-all-read", (callback) => socketEventHandler.handleMarkAllAsRead(socket, callback));
    socket.on("send-admin-notification", (data) => socketEventHandler.handleAdminNotification(socket, data));
    // Issue-related notifications
    socket.on("issue-created", (data) => socketEventHandler.handleIssueCreationNotification(data));
    socket.on("issue-approved", (data) => socketEventHandler.handleIssueApprovalNotification(data));
    // Add other issue-related events...
    socket.on("disconnect", () => socketEventHandler.handleDisconnect(socket));
});
// Prisma graceful shutdown
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Shutting down server...');
    yield prisma.$disconnect();
    process.exit(0);
}));
// Start Server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

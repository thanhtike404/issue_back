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
        origin: "https://issue-tracker-six-mu.vercel.app", // Your frontend URL
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});
// Test the database connection
function testDatabaseConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user = yield prisma.user.findFirst(); // Adjust with any model you have in your schema
            console.log("Database connection is successful. Test user:", user);
        }
        catch (error) {
            console.error("Error connecting to the database:", error);
        }
    });
}
testDatabaseConnection();
// Log Prisma queries with proper typing
//@ts-ignore
prisma.$on('query', (event) => {
    console.log('Query:', event.query);
    console.log('Params:', event.params);
    console.log('Duration:', event.duration);
});
// Notifications route
app.get("/notifications", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notifications = yield prisma.notification.findMany({
            orderBy: { createdAt: "desc" }
        });
        res.json(notifications);
    }
    catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}));
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
    socket.on("disconnect", () => socketEventHandler.handleDisconnect(socket));
});
// Prisma graceful shutdown
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Shutting down server...');
    yield prisma.$disconnect();
    process.exit(0);
}));
// Start Server
const PORT = Number(process.env.PORT) || 4000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

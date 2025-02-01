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
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketInit = void 0;
const client_1 = require("@prisma/client");
const socketInit = (io) => {
    const prismaClient = new client_1.PrismaClient();
    const connectedUsers = new Map();
    // Utility function to safely handle socket actions
    const safeSocketAction = (socket, action) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield action();
        }
        catch (error) {
            console.error("Socket action error:", error);
            socket.emit("error", { error: "An unexpected error occurred. Please try again later." });
        }
    });
    // Emit comments to the client
    const emitComments = (socket, issueId) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const comments = yield prismaClient.issueCommand.findMany({ where: { issueId } });
            socket.emit("fetch-comments", comments);
        }
        catch (error) {
            console.error("Error fetching comments:", error);
            socket.emit("fetch-comments-error", { error: "Failed to fetch comments. Please try again later." });
        }
    });
    // Handle socket connection
    io.on("connection", (socket) => {
        const { email } = socket.handshake.auth;
        if (!email) {
            console.warn("Connection attempt without email. Disconnecting...");
            socket.disconnect(true);
            return;
        }
        console.log(`User connected: ${email} (Socket ID: ${socket.id})`);
        socket.emit("connected", { message: "Connected successfully", socketId: socket.id });
        // Handle fetching comments
        socket.on("get-comments", (issueId) => {
            safeSocketAction(socket, () => __awaiter(void 0, void 0, void 0, function* () {
                console.log("Fetching comments for issue ID:", issueId);
                yield emitComments(socket, issueId);
            }));
        });
        // Handle adding a new comment
        socket.on("add-comment", (data) => {
            safeSocketAction(socket, () => __awaiter(void 0, void 0, void 0, function* () {
                console.log("Adding comment to issue ID:", data.issueId);
                // Add the new comment to the database
                yield prismaClient.issueCommand.create({
                    data: {
                        issueId: data.issueId, // This is fine if issueId is a number
                        userId: data.userId.toString(), // Convert userId to string
                        text: data.text,
                        timestamp: data.timestamp,
                        likes: 0,
                    },
                });
                console.log("Comment added successfully. Fetching updated comments...");
                // Fetch updated comments
                const comments = yield prismaClient.issueCommand.findMany({ where: { issueId: data.issueId } });
                // Broadcast updated comments to all connected sockets
                io.emit("fetch-comments", comments);
            }));
        });
        // Handle disconnection
        socket.on("disconnect", () => {
            console.log(`User disconnected: ${email} (Socket ID: ${socket.id})`);
            connectedUsers.delete(email);
        });
    });
};
exports.socketInit = socketInit;

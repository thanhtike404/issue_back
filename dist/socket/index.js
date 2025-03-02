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
//@ts-ignore
const socketInit = (io) => {
    const prismaClient = new client_1.PrismaClient();
    //@ts-ignore
    const safeSocketAction = (socket, action) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield action();
        }
        catch (error) {
            console.error("Socket action error:", error);
            socket.emit("error", { error: "An unexpected error occurred. Please try again later." });
        }
    });
    //@ts-ignore
    const emitComments = (socket, issueId) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const getComments = yield prismaClient.issueCommand.findMany({
                where: { issueId },
                include: {
                    user: {
                        select: { email: true, id: true, name: true },
                    },
                },
            });
            //@ts-ignore
            const comments = getComments.map(comment => {
                console.log("Raw replies before parsing:", comment.replies); // Debugging log
                return Object.assign(Object.assign({}, comment), { replies: Array.isArray(comment.replies)
                        ? comment.replies
                        : comment.replies && comment.replies !== ""
                            // @ts-ignore
                            ? JSON.parse(comment.replies)
                            : [] });
            });
            console.log("Fetched comments:", comments);
            io.emit("fetch-comments", comments);
        }
        catch (error) {
            console.error("Error fetching comments:", error);
            socket.emit("fetch-comments-error", { error: "Failed to fetch comments. Please try again later." });
        }
    });
    //@ts-ignore
    io.on("connection", (socket) => {
        const { email } = socket.handshake.auth;
        if (!email) {
            console.warn("Connection attempt without email. Disconnecting...");
            socket.disconnect(true);
            return;
        }
        console.log(`User connected: ${email} (Socket ID: ${socket.id})`);
        socket.emit("connected", { message: "Connected successfully", socketId: socket.id });
        socket.on("get-comments", (issueId) => {
            safeSocketAction(socket, () => __awaiter(void 0, void 0, void 0, function* () {
                console.log("Fetching comments for issue ID:", issueId);
                yield emitComments(socket, issueId);
            }));
        });
        //@ts-ignore
        socket.on("add-comment", (data) => {
            safeSocketAction(socket, () => __awaiter(void 0, void 0, void 0, function* () {
                console.log("Adding comment to issue ID:", data.issueId);
                yield prismaClient.issueCommand.create({
                    data: {
                        issueId: data.issueId,
                        userId: data.userId.toString(),
                        text: data.text,
                        timestamp: data.timestamp,
                        likes: 0,
                        replies: "[]", // Initialize as an empty array
                    },
                });
                console.log("Comment added successfully.");
                yield emitComments(socket, data.issueId);
            }));
        });
        // ADD REPLY FUNCTIONALITY
        //@ts-ignore
        socket.on("add-reply", (data) => __awaiter(void 0, void 0, void 0, function* () {
            safeSocketAction(socket, () => __awaiter(void 0, void 0, void 0, function* () {
                console.log(`Adding reply to comment ID: ${data.commentId}`);
                const comment = yield prismaClient.issueCommand.findUnique({
                    where: { id: data.commentId },
                });
                if (!comment) {
                    console.log("Comment not found.");
                    socket.emit("error", { error: "Comment not found." });
                    return;
                }
                let replies = [];
                try {
                    // @ts-ignore
                    replies = comment.replies && comment.replies.trim() !== "" ? JSON.parse(comment.replies) : [];
                }
                catch (error) {
                    console.error("Error parsing replies JSON:", error);
                    replies = [];
                }
                const newReply = {
                    id: Date.now(),
                    userId: data.userId,
                    text: data.text,
                    timestamp: new Date().toISOString(),
                    likes: 0,
                };
                replies.push(newReply);
                yield prismaClient.issueCommand.update({
                    where: { id: data.commentId },
                    data: { replies: JSON.stringify(replies) },
                });
                console.log("Reply added successfully.");
                yield emitComments(socket, comment.issueId);
            }));
        }));
        socket.on("disconnect", () => {
            console.log(`User disconnected: ${email} (Socket ID: ${socket.id})`);
        });
    });
};
exports.socketInit = socketInit;

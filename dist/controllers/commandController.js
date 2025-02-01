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
exports.replyToCommand = exports.likeCommand = exports.getCommandsByIssue = exports.createCommand = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Create a new command
const createCommand = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { issueId, userId, text } = req.body;
        if (!issueId || !userId || !text) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        const newCommand = yield prisma.issueCommand.create({
            data: {
                issueId,
                userId,
                text,
            },
        });
        res.status(201).json(newCommand);
    }
    catch (error) {
        console.error("Error creating command:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.createCommand = createCommand;
// Get commands for a specific issue
const getCommandsByIssue = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { issueId } = req.params;
        const commands = yield prisma.issueCommand.findMany({
            where: { issueId: Number(issueId) },
            include: {
                user: { select: { id: true, name: true, email: true } }, // Include user details
            },
        });
        res.status(200).json(commands);
    }
    catch (error) {
        console.error("Error fetching commands:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getCommandsByIssue = getCommandsByIssue;
// Like a command
const likeCommand = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const updatedCommand = yield prisma.issueCommand.update({
            where: { id: Number(id) },
            data: { likes: { increment: 1 } },
        });
        res.status(200).json(updatedCommand);
    }
    catch (error) {
        console.error("Error liking command:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.likeCommand = likeCommand;
// Reply to a command
const replyToCommand = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { reply } = req.body;
        const command = yield prisma.issueCommand.findUnique({ where: { id: Number(id) } });
        if (!command) {
            return res.status(404).json({ message: "Command not found" });
        }
        const updatedReplies = [...command.replies, reply];
        const updatedCommand = yield prisma.issueCommand.update({
            where: { id: Number(id) },
            data: { replies: updatedReplies },
        });
        res.status(200).json(updatedCommand);
    }
    catch (error) {
        console.error("Error replying to command:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.replyToCommand = replyToCommand;

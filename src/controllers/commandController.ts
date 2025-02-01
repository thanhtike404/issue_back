import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

// Create a new command
export const createCommand = async (req: Request, res: Response) => {
    try {
        const { issueId, userId, text } = req.body;

        if (!issueId || !userId || !text) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const newCommand = await prisma.issueCommand.create({
            data: {
                issueId,
                userId,
                text,
            },
        });

        res.status(201).json(newCommand);
    } catch (error) {
        console.error("Error creating command:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get commands for a specific issue
export const getCommandsByIssue = async (req: Request, res: Response) => {
    try {
        const { issueId } = req.params;

        const commands = await prisma.issueCommand.findMany({
            where: { issueId: Number(issueId) },
            include: {
                user: { select: { id: true, name: true, email: true } }, // Include user details
            },
        });

        res.status(200).json(commands);
    } catch (error) {
        console.error("Error fetching commands:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Like a command
export const likeCommand = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const updatedCommand = await prisma.issueCommand.update({
            where: { id: Number(id) },
            data: { likes: { increment: 1 } },
        });

        res.status(200).json(updatedCommand);
    } catch (error) {
        console.error("Error liking command:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Reply to a command
export const replyToCommand = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { reply } = req.body;

        const command = await prisma.issueCommand.findUnique({ where: { id: Number(id) } });

        if (!command) {
            return res.status(404).json({ message: "Command not found" });
        }

        const updatedReplies = [...(command.replies as any), reply];

        const updatedCommand = await prisma.issueCommand.update({
            where: { id: Number(id) },
            data: { replies: updatedReplies },
        });

        res.status(200).json(updatedCommand);
    } catch (error) {
        console.error("Error replying to command:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

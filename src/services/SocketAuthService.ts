import { Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";

export class SocketAuthService {
    constructor(private prisma: PrismaClient) { }

    async authenticate(socket: Socket, next: (err?: Error) => void) {
        const userId = socket.handshake.auth.userId;
        if (!userId) {
            return next(new Error("Authentication error"));
        }

        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, role: true, name: true }
            });

            if (!user) {
                return next(new Error("User not found"));
            }

            socket.data.user = user;
            next();
        } catch (error) {
            console.error('Authentication error:', error);
            next(new Error("Authentication error"));
        }
    }
}
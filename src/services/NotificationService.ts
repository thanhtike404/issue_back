// services/NotificationService.ts
import { PrismaClient } from '@prisma/client';
import { Server, Socket } from 'socket.io';
type notificationType = {
    title: string;
    message: string;
    type: string;
    userId: string;
    senderId: string;
    issueId: number | null;
    createdAt: Date;
    read: boolean;
};

export default class NotificationService {
    private prisma: PrismaClient;

    constructor(private io: Server) {
        this.prisma = new PrismaClient();
    }

    async createNotification({
        title,
        message,
        type,
        userId,
        senderId,
        issueId,
        createdAt = new Date(),
        read = false
    }: notificationType) {

        const notification = await this.prisma.notification.create({
            data: {
                title,
                message,
                type,
                userId,
                senderId,
                issueId,
                createdAt,
                read
            },
            include: {
                issue: {
                    select: {
                        id: true,
                        title: true,
                        status: true
                    }
                }
            }
        });
        // Send real-time notification
        this.io.to(`user-${userId}`).emit('new-notification', notification);

        // TODO: Implement email notification if needed
        // if (sendEmail) {
        //     // await this.sendEmailNotification(userId, title, message);
        // }

        return notification;
    }

    async getUserNotifications(userId: string) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                issue: {
                    select: {
                        id: true,
                        title: true,
                        status: true
                    }
                }
            }
        });
    }

    async markAsRead(userId: string, notificationId: number) {
        return this.prisma.notification.updateMany({
            where: {
                id: notificationId,
                userId,

            },
            data: { read: true }
        });
    }

    async markAllAsRead(userId: string) {
        return this.prisma.notification.updateMany({
            where: {
                userId,
                read: false
            },
            data: { read: true }
        });
    }

    // async getUnreadCount(userId: string) {
    //     return this.prisma.notification.count({
    //         where: {
    //             userId,
    //             read: false
    //         }
    //     });
    // }
}
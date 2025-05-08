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
// services/NotificationService.ts
const client_1 = require("@prisma/client");
class NotificationService {
    constructor(io) {
        this.io = io;
        this.prisma = new client_1.PrismaClient();
    }
    createNotification(_a) {
        return __awaiter(this, arguments, void 0, function* ({ title, message, type, userId, senderId, issueId, createdAt = new Date(), read = false }) {
            const shouldNotifyAdmins = [
                'issue_creation',
                'issue_approved',
                'issue_rejected',
                'issue_status_change'
            ].includes(type);
            const shouldNotifyAssignee = [
                'issue_assignment',
                'issue_mention',
                'comment',
                'role_change'
            ].includes(type);
            // Case 1: Notify specific user (e.g., assignee)
            if (shouldNotifyAssignee && userId) {
                const notification = yield this.prisma.notification.create({
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
                        issue: { select: { id: true, title: true, status: true } },
                        receiver: { select: { id: true, name: true } },
                        sender: { select: { id: true, name: true } }
                    }
                });
                this.io.to(`user-${userId}`).emit('new-notification', notification);
                return notification;
            }
            // Case 2: Notify all admins and devs
            if (shouldNotifyAdmins) {
                const adminsAndDevs = yield this.prisma.user.findMany({
                    where: { role: { in: [1, 2] } },
                    select: { id: true }
                });
                const notifications = yield Promise.all(adminsAndDevs.map(({ id }) => this.prisma.notification.create({
                    data: {
                        title,
                        message,
                        type,
                        userId: id,
                        senderId,
                        issueId,
                        createdAt: new Date(),
                        read
                    },
                    include: {
                        issue: { select: { id: true, title: true, status: true } },
                        receiver: { select: { id: true, name: true } },
                        sender: { select: { id: true, name: true } }
                    }
                })));
                // Emit to each individual user socket
                notifications.forEach((notification) => {
                    try {
                        this.io.to(`user-${notification.userId}`).emit('new-notification', notification);
                    }
                    catch (err) {
                        console.error(`Error sending notification to user-${notification.userId}:`, err);
                    }
                });
                return notifications;
            }
            // No valid target
            throw new Error("No valid userId provided and type does not require broadcasting.");
        });
    }
    getUserNotifications(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('getting notificaitons');
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
        });
    }
    markAsRead(userId, notificationId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.notification.updateMany({
                where: {
                    id: notificationId,
                    userId,
                },
                data: { read: true }
            });
        });
    }
    markAllAsRead(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.notification.updateMany({
                where: {
                    userId,
                    read: false
                },
                data: { read: true }
            });
        });
    }
}
exports.default = NotificationService;

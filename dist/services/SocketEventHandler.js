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
exports.SocketEventHandler = void 0;
class SocketEventHandler {
    constructor(notificationService) {
        this.notificationService = notificationService;
    }
    handleConnection(socket) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = socket.data.user;
            // Join appropriate rooms
            socket.join(`user-${user.id}`);
            if (user.role === 1)
                socket.join("admin-room");
            if (user.role === 2)
                socket.join("developer-room");
            console.log(`User connected: ${user.name}`);
        });
    }
    handleDisconnect(socket) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`User disconnected: ${socket.data.user.name}`);
        });
    }
    handleGetNotifications(socket, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const notifications = yield this.notificationService.getUserNotifications(socket.data.user.id);
                callback({ success: true, notifications });
            }
            catch (error) {
                console.error('Error fetching notifications:', error);
                callback({ success: false, error: "Failed to fetch notifications" });
            }
        });
    }
    handleAdminNotification(socket, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const notification = yield this.notificationService.createNotification(data);
                if (!notification) {
                    return socket.emit("send-admin-notification", { success: false, error: "Failed to send notification" });
                }
                socket.emit("send-admin-notification", { success: true });
            }
            catch (error) {
                console.error('Error sending admin notification:', error);
                socket.emit("send-admin-notification", { success: false, error: "Failed to send notification" });
            }
        });
    }
    handleMarkAsRead(socket, notificationId, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const notification = yield this.notificationService.markAsRead(socket.data.user.id, notificationId);
                if (!notification) {
                    return callback({ success: false, error: "Notification not found" });
                }
                callback({ success: true });
            }
            catch (error) {
                console.error('Error marking as read:', error);
                callback({ success: false, error: "Failed to mark as read" });
            }
        });
    }
    handleMarkAllAsRead(socket, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.notificationService.markAllAsRead(socket.data.user.id);
                callback({ success: true });
            }
            catch (error) {
                console.error('Error marking all as read:', error);
                callback({ success: false, error: "Failed to mark all as read" });
            }
        });
    }
    // Add methods for all your notification types
    handleIssueCreationNotification(data) {
        return __awaiter(this, void 0, void 0, function* () {
            // Implementation for issue creation notification
        });
    }
    handleIssueApprovalNotification(data) {
        return __awaiter(this, void 0, void 0, function* () {
            // Implementation for approved issue notification
        });
    }
}
exports.SocketEventHandler = SocketEventHandler;

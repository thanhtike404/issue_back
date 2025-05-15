import { Socket,Server } from "socket.io";
import NotificationService from "./NotificationService";

export class SocketEventHandler {

     private connectedUsers: Set<number> = new Set();
    private io: Server;

    constructor(private notificationService: NotificationService, io: Server) {
        this.io = io;
    }

    async handleConnection(socket: Socket) {
        const user = socket.data.user;
        if (!user?.id) return;

        this.connectedUsers.add(user.id);
        
        // Join rooms
        socket.join(`user-${user.id}`);
        // if (user.role === 1) socket.join("admin-room");
        // if (user.role === 2) socket.join("developer-room");

        // Broadcast updated user list
        this.broadcastConnectedUsers();
        console.log(`User connected: ${user.name}`);
    }

    async handleDisconnect(socket: Socket) {
        const user = socket.data.user;
        if (user?.id) {
            this.connectedUsers.delete(user.id);
            this.broadcastConnectedUsers();
        }
        console.log(`User disconnected: ${user?.name || 'Unknown'}`);
    }

    private broadcastConnectedUsers() {
        const connectedUserIds = Array.from(this.connectedUsers);
        this.io.emit('update-connected-users', connectedUserIds);
    }

    handleGetConnectedUsers(socket: Socket, callback: Function) {
        callback(Array.from(this.connectedUsers));
    }

   
    async handleGetNotifications(socket: Socket, callback: Function) {
        try {
            const notifications = await this.notificationService.getUserNotifications(socket.data.user.id);
            callback({ success: true, notifications });
        } catch (error) {
            console.error('Error fetching notifications:', error);
            callback({ success: false, error: "Failed to fetch notifications" });
        }
    }

    async handleAdminNotification(socket: Socket, data: any) {
        try {
            const notification = await this.notificationService.createNotification(data);
            if (!notification) {
                return socket.emit("send-admin-notification", { success: false, error: "Failed to send notification" });
            }
            socket.emit("send-admin-notification", { success: true });
        } catch (error) {
            console.error('Error sending admin notification:', error);
            socket.emit("send-admin-notification", { success: false, error: "Failed to send notification" });
        }
    }

    async handleMarkAsRead(socket: Socket, notificationId: number, callback: Function) {
        try {
            const notification = await this.notificationService.markAsRead(
                socket.data.user.id,
                notificationId
            );
            if (!notification) {
                return callback({ success: false, error: "Notification not found" });
            }
            callback({ success: true });
        } catch (error) {
            console.error('Error marking as read:', error);
            callback({ success: false, error: "Failed to mark as read" });
        }
    }
    async handleMarkAllAsRead(socket: Socket, callback: Function) {
        try {
            await this.notificationService.markAllAsRead(socket.data.user.id);
            callback({ success: true });
        } catch (error) {
            console.error('Error marking all as read:', error);
            callback({ success: false, error: "Failed to mark all as read" });
        }
    }
    // Add methods for all your notification types
    async handleIssueCreationNotification(data: any) {
        // Implementation for issue creation notification
    }

    async handleIssueApprovalNotification(data: any) {
        // Implementation for approved issue notification
    }

  
    // updateConnectedUsers(userIds: number[]) {
    //     this.connectedUsers = new Set(userIds);
    //     console.log(this.connectedUsers)
    // }
    // ... other notification handlers
}
import { PrismaClient } from '@prisma/client';
import { Server, Socket } from 'socket.io';

export default class ChatService {
    private prisma: PrismaClient;

    constructor(private io: Server) {
        this.prisma = new PrismaClient();
    }

    // Get user chats with proper structure
    getUserChats = async (data: any, callback: any) => {
        try {
            const { userId } = data;

            const userChats = await this.prisma.userChat.findMany({
                where: { userId },
                include: {
                    chat: {
                        include: {
                            userChats: {
                                include: {
                                    user: {
                                        select: {
                                            id: true,
                                            name: true,
                                            email: true,
                                            image: true
                                        }
                                    }
                                }
                            },
                            messages: {
                                include: {
                                    user: {
                                        select: {
                                            id: true,
                                            name: true,
                                            image: true
                                        }
                                    }
                                },
                                orderBy: {
                                    timestamp: 'desc'
                                },
                                take: 1
                            }
                        }
                    }
                },
                orderBy: {
                    chat: {
                        updatedAt: 'desc'
                    }
                }
            });

            callback({ success: true, chats: userChats });
        } catch (error) {
            console.error('Error fetching chats:', error);
            callback({ success: false, error: 'Failed to fetch user chats' });
        }
    };

    // Send a message via Socket.IO
    sendMessage = async (socket: Socket, data: any, callback: any) => {
        try {
            const { content, chatId } = data;
            const userId = socket.data.user.id;

            if (!content || !chatId) {
                return callback({ success: false, error: 'Missing required fields' });
            }

            // Check if user is member of the chat
            const userChat = await this.prisma.userChat.findUnique({
                where: {
                    userId_chatId: {
                        userId,
                        chatId
                    }
                }
            });

            if (!userChat) {
                return callback({ success: false, error: 'Access denied' });
            }

            // Create message
            const message = await this.prisma.message.create({
                data: {
                    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    content,
                    chatId,
                    senderId: userId,
                    timestamp: new Date()
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            image: true
                        }
                    }
                }
            });

            // Update chat's updatedAt
            await this.prisma.chat.update({
                where: { id: chatId },
                data: { updatedAt: new Date() }
            });

            // Increment unread count for other members
            await this.prisma.userChat.updateMany({
                where: {
                    chatId,
                    userId: { not: userId }
                },
                data: {
                    unreadCount: {
                        increment: 1
                    }
                }
            });

            // Emit message to all members of the chat
            const chatMembers = await this.prisma.userChat.findMany({
                where: { chatId },
                select: { userId: true }
            });

            chatMembers.forEach((member: { userId: string }) => {
                this.io.to(`user-${member.userId}`).emit('new-message', {
                    message,
                    chatId
                });
            });

            callback({ success: true, message });
        } catch (error) {
            console.error('Error sending message:', error);
            callback({ success: false, error: 'Failed to send message' });
        }
    };

    // Create a new chat
    createChat = async (socket: Socket, data: any, callback: any) => {
        try {
            const { name, type, avatar, memberIds } = data;
            const userId = socket.data.user.id;

            if (!name || !memberIds || memberIds.length === 0) {
                return callback({ success: false, error: 'Missing required fields' });
            }

            // Ensure the creator is included in members
            const allMemberIds = memberIds.includes(userId) ? memberIds : [userId, ...memberIds];

            const chat = await this.prisma.chat.create({
                data: {
                    id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name,
                    type: type || 'PRIVATE',
                    avatar,
                    updatedAt: new Date(),
                    userChats: {
                        create: allMemberIds.map((memberId: string) => ({
                            id: `uc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            userId: memberId,
                            unreadCount: 0
                        }))
                    }
                },
                include: {
                    userChats: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    image: true
                                }
                            }
                        }
                    }
                }
            });

            // Notify all members about the new chat
            allMemberIds.forEach((memberId: string) => {
                this.io.to(`user-${memberId}`).emit('new-chat', chat);
            });

            callback({ success: true, chat });
        } catch (error) {
            console.error('Error creating chat:', error);
            callback({ success: false, error: 'Failed to create chat' });
        }
    };

    // Get chat messages
    getChatMessages = async (socket: Socket, data: any, callback: any) => {
        try {
            const { chatId } = data;
            const userId = socket.data.user.id;

            if (!chatId) {
                return callback({ success: false, error: 'Chat ID is required' });
            }

            // Check if user is member of the chat
            const userChat = await this.prisma.userChat.findUnique({
                where: {
                    userId_chatId: {
                        userId,
                        chatId
                    }
                }
            });

            if (!userChat) {
                return callback({ success: false, error: 'Access denied' });
            }

            const messages = await this.prisma.message.findMany({
                where: { chatId },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            image: true
                        }
                    }
                },
                orderBy: {
                    timestamp: 'asc'
                }
            });

            // Mark messages as read
            await this.prisma.message.updateMany({
                where: {
                    chatId,
                    senderId: { not: userId },
                    read: false
                },
                data: { read: true }
            });

            // Reset unread count
            await this.prisma.userChat.update({
                where: {
                    userId_chatId: {
                        userId,
                        chatId
                    }
                },
                data: { unreadCount: 0, lastReadAt: new Date() }
            });

            callback({ success: true, messages });
        } catch (error) {
            console.error('Error fetching chat messages:', error);
            callback({ success: false, error: 'Failed to fetch messages' });
        }
    };

    // Update message
    updateMessage = async (socket: Socket, data: any, callback: any) => {
        try {
            const { messageId, content } = data;
            const userId = socket.data.user.id;

            if (!messageId || !content) {
                return callback({ success: false, error: 'Missing required fields' });
            }

            const message = await this.prisma.message.findUnique({
                where: { id: messageId }
            });

            if (!message) {
                return callback({ success: false, error: 'Message not found' });
            }

            if (message.senderId !== userId) {
                return callback({ success: false, error: 'Can only edit your own messages' });
            }

            const updatedMessage = await this.prisma.message.update({
                where: { id: messageId },
                data: { content },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            image: true
                        }
                    }
                }
            });

            // Emit updated message to chat members
            const chatMembers = await this.prisma.userChat.findMany({
                where: { chatId: message.chatId },
                select: { userId: true }
            });

            chatMembers.forEach((member: { userId: string }) => {
                this.io.to(`user-${member.userId}`).emit('message-updated', {
                    message: updatedMessage,
                    chatId: message.chatId
                });
            });

            callback({ success: true, message: updatedMessage });
        } catch (error) {
            console.error('Error updating message:', error);
            callback({ success: false, error: 'Failed to update message' });
        }
    };

    // Delete message
    deleteMessage = async (socket: Socket, data: any, callback: any) => {
        try {
            const { messageId } = data;
            const userId = socket.data.user.id;

            if (!messageId) {
                return callback({ success: false, error: 'Message ID is required' });
            }

            const message = await this.prisma.message.findUnique({
                where: { id: messageId }
            });

            if (!message) {
                return callback({ success: false, error: 'Message not found' });
            }

            if (message.senderId !== userId) {
                return callback({ success: false, error: 'Can only delete your own messages' });
            }

            await this.prisma.message.delete({
                where: { id: messageId }
            });

            // Emit message deletion to chat members
            const chatMembers = await this.prisma.userChat.findMany({
                where: { chatId: message.chatId },
                select: { userId: true }
            });

            chatMembers.forEach((member: { userId: string }) => {
                this.io.to(`user-${member.userId}`).emit('message-deleted', {
                    messageId,
                    chatId: message.chatId
                });
            });

            callback({ success: true, message: 'Message deleted successfully' });
        } catch (error) {
            console.error('Error deleting message:', error);
            callback({ success: false, error: 'Failed to delete message' });
        }
    };

    // Get unread message count
    getUnreadCount = async (socket: Socket, callback: any) => {
        try {
            const userId = socket.data.user.id;

            const unreadCounts = await this.prisma.userChat.findMany({
                where: { userId },
                select: {
                    chatId: true,
                    unreadCount: true,
                    chat: {
                        select: {
                            name: true,
                            type: true
                        }
                    }
                }
            });

            const totalUnread = unreadCounts.reduce((sum, chat) => sum + chat.unreadCount, 0);

            callback({ success: true, totalUnread, chatCounts: unreadCounts });
        } catch (error) {
            console.error('Error fetching unread count:', error);
            callback({ success: false, error: 'Failed to fetch unread count' });
        }
    };

    // Join chat room
    joinChat = async (socket: Socket, data: any, callback: any) => {
        try {
            const { chatId } = data;
            const userId = socket.data.user.id;

            if (!chatId) {
                return callback({ success: false, error: 'Chat ID is required' });
            }

            // Check if user is member of the chat
            const userChat = await this.prisma.userChat.findUnique({
                where: {
                    userId_chatId: {
                        userId,
                        chatId
                    }
                }
            });

            if (!userChat) {
                return callback({ success: false, error: 'Access denied' });
            }

            // Join the chat room
            socket.join(`chat-${chatId}`);

            callback({ success: true, message: 'Joined chat room' });
        } catch (error) {
            console.error('Error joining chat:', error);
            callback({ success: false, error: 'Failed to join chat' });
        }
    };

    // Leave chat room
    leaveChat = async (socket: Socket, data: any, callback: any) => {
        try {
            const { chatId } = data;

            if (!chatId) {
                return callback({ success: false, error: 'Chat ID is required' });
            }

            // Leave the chat room
            socket.leave(`chat-${chatId}`);

            callback({ success: true, message: 'Left chat room' });
        } catch (error) {
            console.error('Error leaving chat:', error);
            callback({ success: false, error: 'Failed to leave chat' });
        }
    };
}
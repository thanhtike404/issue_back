// types/messaging.ts

export interface Message {
  id: string;
  content: string;
  chatId: string;
  senderId: string;
  timestamp: Date;
  read: boolean;
  user?: {
    id: string;
    name: string;
    image?: string;
  };
}

export interface Chat {
  id: string;
  name: string;
  type: 'PRIVATE' | 'GROUP';
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  userChats: UserChat[];
  messages: Message[];
}

export interface UserChat {
  id: string;
  userId: string;
  chatId: string;
  lastReadAt?: Date;
  unreadCount: number;
  user?: {
    id: string;
    name: string;
    email?: string;
    image?: string;
  };
  chat?: Chat;
}

export interface UnreadCount {
  totalUnread: number;
  chatCounts: {
    chatId: string;
    unreadCount: number;
    chat: {
      name: string;
      type: string;
    };
  }[];
}

// Client to Server Events
export interface ClientToServerEvents {
  // Chat events
  'get-user-chat': (data: { userId: string }, callback: (response: { success: boolean; chats?: UserChat[]; error?: string }) => void) => void;
  'send-message': (data: { content: string; chatId: string }, callback: (response: { success: boolean; message?: Message; error?: string }) => void) => void;
  'create-chat': (data: { name: string; type?: 'PRIVATE' | 'GROUP'; avatar?: string; memberIds: string[] }, callback: (response: { success: boolean; chat?: Chat; error?: string }) => void) => void;
  'get-chat-messages': (data: { chatId: string }, callback: (response: { success: boolean; messages?: Message[]; error?: string }) => void) => void;
  'update-message': (data: { messageId: string; content: string }, callback: (response: { success: boolean; message?: Message; error?: string }) => void) => void;
  'delete-message': (data: { messageId: string }, callback: (response: { success: boolean; message?: string; error?: string }) => void) => void;
  'get-unread-count': (callback: (response: { success: boolean; totalUnread?: number; chatCounts?: UnreadCount['chatCounts']; error?: string }) => void) => void;
  'join-chat': (data: { chatId: string }, callback: (response: { success: boolean; message?: string; error?: string }) => void) => void;
  'leave-chat': (data: { chatId: string }, callback: (response: { success: boolean; message?: string; error?: string }) => void) => void;

  // Notification events (existing)
  'send-admin-notification': (data: { message: string; type: string; userId: string }) => void;
  'get-notifications': (callback: (response: { success: boolean; notifications?: any[]; error?: string }) => void) => void;
  'mark-as-read': (notificationId: number, callback: (response: { success: boolean; error?: string }) => void) => void;
  'mark-all-read': (callback: (response: { success: boolean; error?: string }) => void) => void;
  'get-connected-users': (callback: (response: { success: boolean; users?: string[]; error?: string }) => void) => void;
}

// Server to Client Events
export interface ServerToClientEvents {
  // Chat events
  'new-message': (data: { message: Message; chatId: string }) => void;
  'new-chat': (chat: Chat) => void;
  'message-updated': (data: { message: Message; chatId: string }) => void;
  'message-deleted': (data: { messageId: string; chatId: string }) => void;
  'chat-updated': (chat: Chat) => void;
  'user-joined-chat': (data: { userId: string; chatId: string; userName: string }) => void;
  'user-left-chat': (data: { userId: string; chatId: string; userName: string }) => void;

  // Notification events (existing)
  'new-notification': (notification: any) => void;
  'update-connected-users': (userIds: string[]) => void;
}

export interface InterServerEvents {
  // For server-to-server communication if needed
}

export interface SocketData {
  user: { 
    id: string; 
    name: string; 
    role: number;
    email?: string;
    image?: string;
  };
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ChatCreateRequest {
  name: string;
  type: 'PRIVATE' | 'GROUP';
  avatar?: string;
  memberIds: string[];
}

export interface MessageSendRequest {
  content: string;
  chatId: string;
}

export interface MessageUpdateRequest {
  messageId: string;
  content: string;
}

export interface MessageDeleteRequest {
  messageId: string;
}

export interface ChatJoinRequest {
  chatId: string;
}

// Real-time event types
export interface TypingEvent {
  chatId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface ReadReceiptEvent {
  chatId: string;
  userId: string;
  messageIds: string[];
  readAt: Date;
}

export interface OnlineStatusEvent {
  userId: string;
  userName: string;
  isOnline: boolean;
  lastSeen?: Date;
} 
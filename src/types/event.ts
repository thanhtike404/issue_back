export interface ClientToServerEvents {
    'send-admin-notification': (data: { message: string; type: string; userId: string }) => void;
    'get-notifications': (callback: (response: { success: boolean; notifications?: any[]; error?: string }) => void) => void;
    'mark-as-read': (notificationId: number, callback: (response: { success: boolean; error?: string }) => void) => void;
    'mark-all-read': (callback: (response: { success: boolean; error?: string }) => void) => void;
}

export interface ServerToClientEvents {
    'new-notification': (notification: any) => void;
}



export interface InterServerEvents { }
export interface SocketData {
    user: { id: string; name: string; role: number };
}


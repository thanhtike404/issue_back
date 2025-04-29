// types/notification.ts
export type NotificationType =
    | 'issue_creation'
    | 'issue_approved'
    | 'issue_rejected'
    | 'role_changes'
    | 'issue_assignment'
    | 'issue_status_change'
    | 'issue_comment'
    | 'issue_mention';

export interface Notification {
    id?: string;
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    read: boolean;
    createdAt: Date;
    senderId?: string;
    issueId?: string | null;
}
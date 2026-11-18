export type ChatSessionStatus = 'Pending' | 'Active' | 'Closed';

export type ChatEventType = 'Created' | 'Accepted' | 'Transferred' | 'Left' | 'Closed';

export interface SendMessageRequestDto {
    content?: string;
    attachmentUrl?: string;
}

export interface TransferSessionRequestDto {
    targetStaffId: number;
    note?: string;
}

export interface UpdateSessionNoteRequestDto {
    internalNote?: string;
}

export interface ChatQueueFilterDto {
    status?: ChatSessionStatus | number;
    staffId?: number;
    pageNumber?: number;
    pageSize?: number;
}

export interface ChatMessageDto {
    id: number;
    chatSessionId: number;
    senderId: number;
    senderName: string;
    senderRole: number | string;
    content?: string;
    attachmentUrl?: string;
    isRead: boolean;
    createdAt: string;
}

export interface ChatSessionEventDto {
    id: number;
    chatSessionId: number;
    eventType: ChatEventType | number;
    eventDescription: string;
    actorId: number;
    actorName: string;
    note?: string;
    createdAt: string;
}

export interface ChatTimelineItemDto {
    itemType: 'Message' | 'Event' | string;
    timestamp: string;
    message?: ChatMessageDto;
    event?: ChatSessionEventDto;
}

export interface CustomerChatSessionDto {
    id: number;
    status: ChatSessionStatus | number;
    staffDisplayName: string;
    hasAssignedStaff: boolean;
    unreadMessagesCount: number;
    startedAt: string;
    closedAt?: string;
    timeline: ChatTimelineItemDto[];
}

export interface StaffChatSessionDto {
    id: number;
    status: ChatSessionStatus | number;
    customerId: number;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    staffId?: number;
    staffName?: string;
    internalNote?: string;
    lastMessagePreview?: string;
    lastActivityAt?: string;
    unreadCount: number;
    startedAt: string;
    closedAt?: string;
    rowVersion?: string | number[];
}

export interface OnlineStaffDto {
    staffId: number;
    fullName: string;
    email: string;
    currentActiveSessionsCount: number;
}

export interface ChatQueueResponseDto {
    items: StaffChatSessionDto[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
}

export interface StaffSessionDetailResponseDto {
    session: StaffChatSessionDto;
    timeline: ChatTimelineItemDto[];
}

import * as signalR from '@microsoft/signalr';
import type { ChatMessageDto, ChatSessionEventDto } from '../types/chat';

const getHubUrl = () => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
    if (apiBase.startsWith('http')) {
        try {
            const url = new URL(apiBase);
            return `${url.origin}/hubs/chat`;
        } catch {
            return '/hubs/chat';
        }
    }
    return '/hubs/chat';
};

class ChatHubService {
    private connection: signalR.HubConnection | null = null;
    private connectionPromise: Promise<void> | null = null;

    public getConnection(): signalR.HubConnection | null {
        return this.connection;
    }

    public async start(): Promise<void> {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            return;
        }

        if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
            return;
        }

        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        if (!this.connection) {
            this.connection = new signalR.HubConnectionBuilder()
                .withUrl(getHubUrl(), {
                    accessTokenFactory: () => localStorage.getItem('accessToken') || '',
                })
                .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
                .configureLogging(signalR.LogLevel.Warning)
                .build();
        }

        this.connectionPromise = this.connection
            .start()
            .then(() => {
                // Connected successfully
            })
            .catch((err) => {
                console.warn('[SignalR] Lỗi kết nối Hub LiveChat:', err);
            })
            .finally(() => {
                this.connectionPromise = null;
            });

        return this.connectionPromise;
    }

    public async stop(): Promise<void> {
        if (this.connection) {
            try {
                await this.connection.stop();
            } catch (err) {
                console.warn('[SignalR] Lỗi ngắt kết nối:', err);
            }
            this.connection = null;
            this.connectionPromise = null;
        }
    }

    public async joinSessionRoom(sessionId: number): Promise<void> {
        await this.start();
        if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
            try {
                await this.connection.invoke('JoinSessionRoom', sessionId);
            } catch (err) {
                console.warn(`[SignalR] Lỗi JoinSessionRoom (${sessionId}):`, err);
            }
        }
    }

    public async leaveSessionRoom(sessionId: number): Promise<void> {
        if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
            try {
                await this.connection.invoke('LeaveSessionRoom', sessionId);
            } catch (err) {
                console.warn(`[SignalR] Lỗi LeaveSessionRoom (${sessionId}):`, err);
            }
        }
    }

    public async getOnlineStaffIds(): Promise<number[]> {
        await this.start();
        if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
            try {
                return await this.connection.invoke<number[]>('GetOnlineStaffIds');
            } catch (err) {
                console.warn('[SignalR] Lỗi GetOnlineStaffIds:', err);
            }
        }
        return [];
    }

    // ==========================================
    // LẮNG NGHE SỰ KIỆN PHÒNG CHAT (SESSION ROOM)
    // ==========================================

    public onReceiveMessage(handler: (message: ChatMessageDto) => void): () => void {
        this.connection?.on('ReceiveMessage', handler);
        return () => this.connection?.off('ReceiveMessage', handler);
    }

    public onSessionAccepted(handler: (event: ChatSessionEventDto) => void): () => void {
        this.connection?.on('SessionAccepted', handler);
        return () => this.connection?.off('SessionAccepted', handler);
    }

    public onSessionTransferred(handler: (event: ChatSessionEventDto) => void): () => void {
        this.connection?.on('SessionTransferred', handler);
        return () => this.connection?.off('SessionTransferred', handler);
    }

    public onSessionLeft(handler: (event: ChatSessionEventDto) => void): () => void {
        this.connection?.on('SessionLeft', handler);
        return () => this.connection?.off('SessionLeft', handler);
    }

    public onSessionClosed(handler: (event: ChatSessionEventDto) => void): () => void {
        this.connection?.on('SessionClosed', handler);
        return () => this.connection?.off('SessionClosed', handler);
    }

    // ==========================================
    // LẮNG NGHE SỰ KIỆN HÀNG ĐỢI (STAFF QUEUE)
    // ==========================================

    public onQueueMessageReceived(handler: (sessionId: number, previewText: string) => void): () => void {
        this.connection?.on('QueueMessageReceived', handler);
        return () => this.connection?.off('QueueMessageReceived', handler);
    }

    public onQueueSessionAccepted(handler: (sessionId: number, staffId: number) => void): () => void {
        this.connection?.on('QueueSessionAccepted', handler);
        return () => this.connection?.off('QueueSessionAccepted', handler);
    }

    public onQueueSessionUpdated(handler: (sessionId: number) => void): () => void {
        this.connection?.on('QueueSessionUpdated', handler);
        return () => this.connection?.off('QueueSessionUpdated', handler);
    }

    public onQueueSessionRevertedToPending(handler: (sessionId: number) => void): () => void {
        this.connection?.on('QueueSessionRevertedToPending', handler);
        return () => this.connection?.off('QueueSessionRevertedToPending', handler);
    }

    public onQueueSessionClosed(handler: (sessionId: number) => void): () => void {
        this.connection?.on('QueueSessionClosed', handler);
        return () => this.connection?.off('QueueSessionClosed', handler);
    }

    public onStaffOnlineStatusChanged(handler: (staffId: number, isOnline: boolean) => void): () => void {
        this.connection?.on('StaffOnlineStatusChanged', handler);
        return () => this.connection?.off('StaffOnlineStatusChanged', handler);
    }
}

export const chatHubService = new ChatHubService();

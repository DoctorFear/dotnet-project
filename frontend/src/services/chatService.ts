import { requestApi } from './apiClient';
import type {
    CustomerChatSessionDto,
    SendMessageRequestDto,
    ChatMessageDto,
    ChatQueueFilterDto,
    ChatQueueResponseDto,
    StaffSessionDetailResponseDto,
    ChatSessionEventDto,
    TransferSessionRequestDto,
    UpdateSessionNoteRequestDto,
} from '../types/chat';

export const chatService = {
    // ==========================================
    // PHÂN HỆ KHÁCH HÀNG (UC23)
    // ==========================================

    /**
     * Lấy hoặc khởi tạo phiên chat hiện tại của khách hàng kèm timeline lịch sử
     */
    getMySession: async (): Promise<CustomerChatSessionDto> => {
        return requestApi<CustomerChatSessionDto>('/chat/my-session', {
            method: 'GET',
        });
    },

    /**
     * Khách hàng gửi tin nhắn (văn bản và/hoặc hình ảnh đính kèm)
     */
    sendCustomerMessage: async (sessionId: number, payload: SendMessageRequestDto): Promise<ChatMessageDto> => {
        return requestApi<ChatMessageDto>(`/chat/sessions/${sessionId}/messages`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    /**
     * Khách hàng tải ảnh đính kèm lên máy chủ/Dropbox (tối đa 5MB)
     */
    uploadCustomerAttachment: async (file: File): Promise<{ url: string }> => {
        const formData = new FormData();
        formData.append('File', file);

        return requestApi<{ url: string }>('/chat/attachments', {
            method: 'POST',
            body: formData,
        });
    },

    /**
     * Đánh dấu toàn bộ tin nhắn tư vấn là đã đọc (tắt chấm đỏ thông báo)
     */
    markAsReadByCustomer: async (sessionId: number): Promise<void> => {
        await requestApi<void>(`/chat/sessions/${sessionId}/mark-read`, {
            method: 'POST',
        });
    },

    // ==========================================
    // PHÂN HỆ NHÂN VIÊN & QUẢN TRỊ VIÊN (UC24)
    // ==========================================

    /**
     * Lấy danh sách hàng đợi các phiên chat theo tab (Pending, Active, Closed)
     */
    getStaffQueue: async (filter: ChatQueueFilterDto): Promise<ChatQueueResponseDto> => {
        const params = new URLSearchParams();
        if (filter.status !== undefined) {
            let statusVal = filter.status;
            if (filter.status === 'Pending') statusVal = 1;
            else if (filter.status === 'Active') statusVal = 2;
            else if (filter.status === 'Closed') statusVal = 3;
            params.append('Status', String(statusVal));
        }
        if (filter.staffId !== undefined) params.append('StaffId', String(filter.staffId));
        if (filter.pageNumber !== undefined) params.append('PageNumber', String(filter.pageNumber));
        if (filter.pageSize !== undefined) params.append('PageSize', String(filter.pageSize));

        return requestApi<ChatQueueResponseDto>(`/staff/chat/queue?${params.toString()}`, {
            method: 'GET',
        });
    },

    /**
     * Lấy chi tiết phiên chat, timeline trao đổi và hồ sơ khách hàng
     */
    getStaffSessionDetail: async (sessionId: number): Promise<StaffSessionDetailResponseDto> => {
        return requestApi<StaffSessionDetailResponseDto>(`/staff/chat/sessions/${sessionId}`, {
            method: 'GET',
        });
    },

    /**
     * Nhân viên tiếp nhận độc quyền phiên chat từ hàng đợi (chặn tranh chấp E1)
     */
    acceptSession: async (sessionId: number): Promise<ChatSessionEventDto> => {
        return requestApi<ChatSessionEventDto>(`/staff/chat/sessions/${sessionId}/accept`, {
            method: 'POST',
        });
    },

    /**
     * Nhân viên gửi tin nhắn phản hồi tới khách hàng
     */
    sendStaffMessage: async (sessionId: number, payload: SendMessageRequestDto): Promise<ChatMessageDto> => {
        return requestApi<ChatMessageDto>(`/staff/chat/sessions/${sessionId}/messages`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    /**
     * Chuyển giao phiên chat cho nhân viên khác trong ca trực
     */
    transferSession: async (sessionId: number, payload: TransferSessionRequestDto): Promise<ChatSessionEventDto> => {
        return requestApi<ChatSessionEventDto>(`/staff/chat/sessions/${sessionId}/transfer`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    /**
     * Nhân viên rời phiên, đưa phiên quay trở lại tab Đang chờ
     */
    leaveSession: async (sessionId: number): Promise<ChatSessionEventDto> => {
        return requestApi<ChatSessionEventDto>(`/staff/chat/sessions/${sessionId}/leave`, {
            method: 'POST',
        });
    },

    /**
     * Đóng và kết thúc phiên hỗ trợ
     */
    closeSession: async (sessionId: number): Promise<ChatSessionEventDto> => {
        return requestApi<ChatSessionEventDto>(`/staff/chat/sessions/${sessionId}/close`, {
            method: 'POST',
        });
    },

    /**
     * Cập nhật ghi chú nội bộ của phiên
     */
    updateInternalNote: async (sessionId: number, payload: UpdateSessionNoteRequestDto): Promise<void> => {
        await requestApi<void>(`/staff/chat/sessions/${sessionId}/note`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    },

    /**
     * Nhân viên tải ảnh đính kèm khi tư vấn
     */
    uploadStaffAttachment: async (file: File): Promise<{ url: string }> => {
        const formData = new FormData();
        formData.append('File', file);

        return requestApi<{ url: string }>('/staff/chat/attachments', {
            method: 'POST',
            body: formData,
        });
    },
};

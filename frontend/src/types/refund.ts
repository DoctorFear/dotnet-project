export interface RefundRequest {
    orderId: number;
    reason: string;
    shippingMethod: string;
    description: string;
    bankAccount: string;
    images?: File[];
    video?: File | null;
}

export interface RefundResponse {
    success: boolean;
    message: string;
}

export interface RefundResponseDto {
    id: number;
    orderId: number;
    orderStatus: string;
    reason: string;
    shippingMethod: string;
    description: string;
    bankAccount: string;
    imageUrls: string[];
    videoUrl?: string;
    createdAt: string;
}

export interface PagedResult<T> {
    items: T[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
}

export const getRefundOrderStatusMeta = (status?: string) => {
    const normalized = (status || '').trim().toLowerCase();

    if (normalized === 'returnrequested') {
        return {
            label: 'Chờ duyệt hoàn trả',
            canApprove: true,
            tone: 'pending' as const,
        };
    }

    if (normalized === 'returnapproved') {
        return {
            label: 'Đã duyệt - chờ Shipper thu hồi',
            canApprove: false,
            tone: 'pending' as const,
        };
    }

    if (normalized === 'returned' || normalized === 'refunded') {
        return {
            label: 'Hoàn trả thành công',
            canApprove: false,
            tone: 'returned' as const,
        };
    }

    return {
        label: status || 'Không xác định',
        canApprove: false,
        tone: 'default' as const,
    };
};
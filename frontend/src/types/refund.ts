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
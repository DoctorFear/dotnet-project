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
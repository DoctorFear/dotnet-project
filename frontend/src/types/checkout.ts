export interface CheckoutItemDto {
    bookId: number;
    quantity: number;
    purchaseType: number;
    rentalDuration?: number | null;
}

export interface CreateCheckoutRequest {
    userId: number;
    pointsUsed?: number | null;
    shippingAddress: string;
    items: CheckoutItemDto[];
}

export interface CreateCheckoutResponse {
    orderId: number;
    status: number;
    subTotal: number;
    discountAmount: number;
    finalAmount: number;
    orderDate: string;
    message: string;
}

export interface CreateMomoResponse {
    orderId: number;
    payUrl: string;
    qrCodeUrl: string;
    amount: number;
    message: string;
}
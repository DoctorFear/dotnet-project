export interface ShipperDto {
    id: number;
    name: string;
    phone: string;
    area: string;
    status: string; // Active, Busy, Off
    maxConcurrentOrders: number;
    activeOrdersCount: number;
}

export interface PhysicalOrderSummaryDto {
    orderId: number;
    orderCode: string;
    customerName: string;
    orderDate: string;
    finalAmount: number;
    shippingAddress: string;
    status: string;
    isPaid: boolean;
    shipperId?: number | null;
    shipperName?: string | null;
}

export interface PhysicalOrderItemDto {
    bookId: number;
    bookTitle: string;
    coverImg: string;
    quantity: number;
    unitPrice: number;
    subTotal: number;
}

export interface OrderTimelineStepDto {
    stepCode: string;
    title: string;
    description: string;
    isCompleted: boolean;
    isCurrent: boolean;
    timestamp?: string | null;
}

export interface OrderTrackingDetailDto {
    orderId: number;
    orderCode: string;
    orderDate: string;
    status: string;
    shippingAddress: string;
    subTotal: number;
    discountAmount: number;
    finalAmount: number;
    isPaid: boolean;
    shipperId?: number | null;
    shipperName?: string | null;
    shipperPhone?: string | null;
    items: PhysicalOrderItemDto[];
    timeline: OrderTimelineStepDto[];
}

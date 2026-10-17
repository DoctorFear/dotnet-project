export enum OrderStatus {
    Pending = 1,
    Confirmed = 2,
    Prepared = 3,
    Shipping = 4,
    Completed = 5,
    Failed = 6,
    ReturnRequested = 7,
    ReturnApproved = 8,
    Returned = 9
}

export interface OrderItem {
    id: number;
    bookId: number;
    book?: { 
        title: string; 
        coverImg?: string;
        author?: string;
    };
    quantity: number;
    unitPrice: number;
    purchaseType?: number | string;
    rentalDuration?: number | string | null;
}

export interface Order {
    id: number;
    orderDate: string;
    updatedAt?: string;
    subTotal?: number;
    discountAmount?: number;
    finalAmount: number;
    shippingAddress?: string;
    status: OrderStatus;
    isPaid: boolean;
    packingIssue?: string;
    orderItems: OrderItem[];
    payUrl?: string;
}

export interface PagedResult<T> {
    items: T[];
    pageNumber: number;
    pageSize: number;
    totalCount: number;
}
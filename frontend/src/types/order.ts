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
        id?: number;
        title: string; 
        coverImg?: string;
        author?: string;
    };
    quantity: number;
    unitPrice: number;
    purchaseType?: number | string;
    rentalDuration?: number | string | null;
    rentalStartDate?: string | null;
    rentalEndDate?: string | null;
}

export interface Order {
    id: number;
    user?: { id: number; fullName: string; email?: string; phoneNumber?: string | null } | null;
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
    completedAt?: string | null;
    returnDeadline?: string | null;
    failureReason?: string | null;
    paymentMethod?: string | null;
    returnInfo?: OrderReturnInfo | null;
    reviews?: OrderHistoryReview[];
    rewardPoints?: number;
    presentationScenario?: number | null;
}

export interface OrderReturnInfo {
    reason: string;
    description: string;
    imageUrls: string[];
    videoUrl?: string | null;
    outcome?: 'rejected' | 'collection_failed' | null;
    outcomeReason?: string | null;
}

export interface OrderHistoryReview {
    bookId: number;
    itemId?: number;
    rating: number;
    content: string;
    reason?: string;
    isHidden?: boolean;
}

export interface PagedResult<T> {
    items: T[];
    pageNumber: number;
    pageSize: number;
    totalCount: number;
}

export interface OrderHistoryFilters {
    bookTitle?: string;
    fromDate?: string;
    toDate?: string;
    orderType?: 'all' | 'physical' | 'online' | 'mixed';
    statusGroup?: 'all' | 'preparing' | 'shipping' | 'completed' | 'returns';
    sortBy?: 'newest' | 'oldest' | 'price_asc' | 'price_desc';
}

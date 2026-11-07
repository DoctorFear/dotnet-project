import type { PagedResult } from './order';

export type WorkflowPage<T> = PagedResult<T>;
export type DeliveryStatus =
    | 'Pending'
    | 'Confirmed'
    | 'Prepared'
    | 'Shipping'
    | 'Completed'
    | 'Failed'
    | 'ReturnRequested'
    | 'ReturnApproved'
    | 'Returned';
export interface DeliveryOrder {
    orderId: number;
    orderCode: string;
    customerName: string;
    receiverPhone: string | null;
    shippingAddress: string;
    finalAmount: number;
    codAmount: number;
    isPaid: boolean;
    status: DeliveryStatus;
    orderDate: string;
}
export interface DeliveryDetail extends DeliveryOrder {
    isReadOnly: boolean;
    completedAt: string | null;
    failureReason: string | null;
    failureNote: string | null;
    items: { bookId: number; bookTitle: string; quantity: number; unitPrice: number }[];
}
export interface DeliveryQuery {
    pageNumber: number;
    pageSize: number;
    keyword?: string;
    status?: string;
}
export interface FailureReason {
    id: number;
    reasonText: string;
    description?: string;
}
export interface DeliveryUpdate {
    newStatus: DeliveryStatus;
    failureReasonId?: number;
    failureNote?: string;
}
export interface PackingOrder {
    orderId: number;
    customerName: string;
    orderDate: string;
    totalItems: number;
    finalAmount: number;
    status: number;
    packingIssue: string | null;
}
export interface PackingDetail {
    orderId: number;
    customerName: string;
    shippingAddress: string;
    receiverPhone: string | null;
    packingIssue: string | null;
    items: {
        bookId: number;
        bookTitle: string;
        bookCover: string | null;
        quantity: number;
        unitPrice: number;
    }[];
}
export interface PackingQuery {
    pageNumber: number;
    pageSize: number;
    keyword?: string;
    fromDate?: string;
    toDate?: string;
}
export interface PointBalance {
    userId: number;
    currentPoints: number;
    pendingPoints: number;
    totalPointsEarned: number;
    tierName: string;
    pointRate: number;
    totalSpent: number;
}
export interface MembershipTier {
    id: number;
    tierName: string;
    minSpending: number;
    pointRate: number;
    benefits: string | null;
}
export interface PointTransaction {
    id: number;
    orderId: number | null;
    pointUsed: number;
    transactionType: string;
    description: string | null;
    createdAt: string;
    status: 'Available' | 'Pending' | 'Cancelled';
    availableAt: string | null;
}
export interface OrderPoints {
    orderId: number;
    pendingPoints: number;
    availablePoints: number;
    cancelledPoints: number;
    availableAt: string | null;
    receiptConfirmedAt: string | null;
    canConfirmReceipt: boolean;
}
export interface PointPreview {
    pointsUsed: number;
    maxPointsAllowed: number;
    discountAmount: number;
    finalAmount: number;
    message: string;
}
export interface MemberReview {
    id: number;
    orderId: number | null;
    bookId: number;
    bookTitle: string;
    rating: number;
    title: string | null;
    content: string;
    imageUrls: string | null;
    verificationLabel: string | null;
    createdAt: string;
}
export interface ReviewDraft {
    orderId?: number;
    bookId: number;
    rating: number;
    title?: string;
    content: string;
    imageUrls?: string;
}
export interface ReviewOrder {
    orderId: number;
    orderDate: string;
    books: { bookId: number; title: string; coverImg: string | null; purchaseType: number }[];
}
export interface WorkflowNotification {
    id: number;
    orderId: number | null;
    message: string;
    createdAt: string;
}

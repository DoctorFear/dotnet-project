import { requestApi } from './apiClient';
import type {
    DeliveryDetail,
    DeliveryOrder,
    DeliveryQuery,
    DeliveryUpdate,
    FailureReason,
    MembershipTier,
    MemberReview,
    OrderPoints,
    PackingDetail,
    PackingOrder,
    PackingQuery,
    PackingVerification,
    PointBalance,
    PointPreview,
    PointHistoryQuery,
    PointHistoryResult,
    ReviewDraft,
    ReviewOrder,
    WorkflowNotification,
    WorkflowPage,
} from '../types/workflow';

const queryString = (values: object) => {
    const query = new URLSearchParams();
    Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== '') query.set(key, String(value));
    });
    return query.toString();
};
const json = (method: string, body?: unknown): RequestInit => ({
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

export const workflowService = {
    deliveries: (query: DeliveryQuery) =>
        requestApi<WorkflowPage<DeliveryOrder>>(`/Delivery/my-deliveries?${queryString(query)}`),
    delivery: (id: number) => requestApi<DeliveryDetail>(`/Delivery/my-deliveries/${id}`),
    updateDelivery: (id: number, update: DeliveryUpdate) =>
        requestApi<unknown>(`/Delivery/my-deliveries/${id}/status`, json('PUT', update)),
    failureReasons: () => requestApi<FailureReason[]>('/Delivery/failure-reasons'),
    packingOrders: (query: PackingQuery) =>
        requestApi<WorkflowPage<PackingOrder>>(`/Fulfillment/pending-orders?${queryString(query)}`),
    packingDetail: (id: number) => requestApi<PackingDetail>(`/Fulfillment/orders/${id}`),
    confirmPacking: (id: number, verification: PackingVerification) =>
        requestApi<unknown>(`/Fulfillment/orders/${id}/confirm-packing`, json('POST', verification)),
    packingIssue: (id: number, reason: string) =>
        requestApi<unknown>(`/Fulfillment/orders/${id}/packing-issue`, json('POST', { reason })),
    balance: () => requestApi<PointBalance>('/FPoint/balance'),
    pointHistory: (query: PointHistoryQuery) =>
        requestApi<PointHistoryResult>(`/FPoint/history?${queryString(query)}`),
    tiers: () => requestApi<MembershipTier[]>('/FPoint/tiers'),
    previewPoints: (pointsToUse: number, totalAmount: number) =>
        requestApi<PointPreview>('/FPoint/apply', json('POST', { pointsToUse, totalAmount })),
    orderPoints: (id: number) => requestApi<OrderPoints>(`/FPoint/orders/${id}/points`),
    confirmReceipt: (id: number) =>
        requestApi<OrderPoints>(
            `/FPoint/orders/${id}/confirm-receipt`,
            json('POST', { acceptCloseReturnWindow: true }),
        ),
    myReviews: (pageNumber: number, pageSize: number, bookId?: number) =>
        requestApi<WorkflowPage<MemberReview>>(
            `/Reviews/my-reviews?${queryString({ pageNumber, pageSize, bookId })}`,
        ),
    reviewOrders: (pageNumber: number, pageSize: number, bookId?: number) =>
        requestApi<WorkflowPage<ReviewOrder>>(
            `/Reviews/eligible-orders?${queryString({ pageNumber, pageSize, bookId })}`,
        ),
    createReview: (review: ReviewDraft) =>
        requestApi<{ message: string; data: MemberReview }>('/Reviews', json('POST', review)),
    updateReview: (id: number, review: ReviewDraft) =>
        requestApi<unknown>(`/Reviews/${id}`, json('PUT', review)),
    deleteReview: (id: number) => requestApi<unknown>(`/Reviews/${id}`, json('DELETE')),
    uploadReviewImage: (file: File) => {
        const body = new FormData();
        body.append('file', file);
        return requestApi<{ fileUrl: string }>('/Reviews/images', { method: 'POST', body });
    },
    notifications: () =>
        requestApi<WorkflowPage<WorkflowNotification>>('/fulfillment-notifications?page=1&pageSize=20'),
};
export type WorkflowApi = typeof workflowService;

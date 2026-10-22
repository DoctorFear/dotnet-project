import { requestApi } from './apiClient';
import type { Order, OrderHistoryFilters, PagedResult } from '../types/order';

export const getMyOrders = async (pageNumber = 1, pageSize = 50, filters: OrderHistoryFilters = {}): Promise<PagedResult<Order>> => {
    const query = new URLSearchParams({ pageNumber: String(pageNumber), pageSize: String(pageSize) });
    Object.entries(filters).forEach(([key, value]) => { if (value && value !== 'all') query.set(key, value); });
    return requestApi<PagedResult<Order>>(`/order?${query}`);
};

export const getOrderDetail = async (orderId: number | string): Promise<Order> => {
    return requestApi<Order>(`/order/${orderId}`);
};

export const cancelOrder = async (orderId: number): Promise<{ message: string }> => {
    return requestApi<{ message: string }>(`/order/${orderId}/cancel`, { method: 'POST' });
};

export const requestRefundOrder = async (orderId: number): Promise<{ message: string }> => {
    return requestApi<{ message: string }>(`/order/${orderId}/request-refund`, { method: 'POST' });
};


import { requestApi } from './apiClient';
import type { Order, PagedResult } from '../types/order';

export const getMyOrders = async (pageNumber = 1, pageSize = 50): Promise<PagedResult<Order>> => {
    return requestApi<PagedResult<Order>>(`/order?pageNumber=${pageNumber}&pageSize=${pageSize}`);
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
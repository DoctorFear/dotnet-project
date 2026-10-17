import { requestApi } from './apiClient';
import type { Order, PagedResult } from '../types/order';
import { OrderStatus } from '../types/order'; 

export const getPagedOrdersAdmin = async (pageNumber = 1, pageSize = 10, status?: OrderStatus, searchKeyword?: string): Promise<PagedResult<Order>> => {
    let url = `/order?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    if (status) url += `&status=${status}`;
    if (searchKeyword) url += `&searchKeyword=${encodeURIComponent(searchKeyword)}`;
    return requestApi<PagedResult<Order>>(url);
};

export const updateOrderStatus = async (id: number, newStatus: OrderStatus): Promise<{ message: string }> => {
    return requestApi<{ message: string }>(`/order/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ newStatus })
    });
};

export const approveReturnOrder = async (id: number): Promise<{ message: string }> => {
    return requestApi<{ message: string }>(`/order/${id}/approve-refund`, {
        method: 'PUT'
    });
};
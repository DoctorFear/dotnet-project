import { requestApi } from './apiClient';
import type {
    ShipperDto,
    PhysicalOrderSummaryDto,
    OrderTrackingDetailDto,
} from '../types/shipper';

export const shipperService = {
    // 1. SHIPPERS & DISPATCH
    getShippers: async (status = '', area = ''): Promise<ShipperDto[]> => {
        const params = new URLSearchParams();
        if (status) params.set('status', status);
        if (area) params.set('area', area);
        const query = params.toString();
        const [shippers, orders] = await Promise.all([
            requestApi<ShipperDto[]>(`/Shippers${query ? `?${query}` : ''}`),
            requestApi<PhysicalOrderSummaryDto[]>('/PhysicalOrders').catch(() => []),
        ]);

        if (orders.length > 0) {
            const inactiveStatuses = new Set(['completed', 'failed', 'returned']);
            return shippers.map((shipper) => ({
                ...shipper,
                activeOrdersCount: orders.filter((order) =>
                    order.shipperId === shipper.id
                    && !inactiveStatuses.has(order.status.toLowerCase())
                ).length,
            }));
        }

        return shippers;
    },

    createShipper: (payload: Omit<ShipperDto, 'id' | 'activeOrdersCount'>) =>
        requestApi<{ message: string }>('/Shippers', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),

    updateShipper: (id: number, payload: Omit<ShipperDto, 'id' | 'activeOrdersCount'>) =>
        requestApi<{ message: string }>(`/Shippers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        }),

    updateShipperStatus: (id: number, status: string) =>
        requestApi<{ message: string }>(`/Shippers/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        }),

    getOrdersByShipper: (shipperId: number) =>
        requestApi<PhysicalOrderSummaryDto[]>(`/Shippers/${shipperId}/orders`),

    assignOrderToShipper: (orderId: number, shipperId: number) =>
        requestApi<{ message: string }>('/Shippers/assign', {
            method: 'POST',
            body: JSON.stringify({ orderId, shipperId }),
        }),

    unassignOrder: (orderId: number) =>
        requestApi<{ message: string }>(`/Shippers/unassign/${orderId}`, { method: 'PUT' }),

    // 2. PHYSICAL ORDERS & TRACKING
    getPhysicalOrders: (status = '', searchKeyword = '') => {
        const params = new URLSearchParams();
        if (status) params.set('status', status);
        if (searchKeyword) params.set('searchKeyword', searchKeyword);
        const query = params.toString();
        return requestApi<PhysicalOrderSummaryDto[]>(
            `/PhysicalOrders${query ? `?${query}` : ''}`
        );
    },

    getOrderTracking: (orderId: number) =>
        requestApi<OrderTrackingDetailDto>(`/PhysicalOrders/${orderId}/tracking`),

    updatePhysicalOrderStatus: (orderId: number, newStatus: string) =>
        requestApi<{ message: string }>(`/PhysicalOrders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ newStatus }),
        }),
};

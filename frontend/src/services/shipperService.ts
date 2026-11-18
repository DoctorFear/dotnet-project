import type {
    ShipperDto,
    PhysicalOrderSummaryDto,
    OrderTrackingDetailDto,
} from '../types/shipper';

async function handleResponse<T>(res: Response): Promise<T> {
    const text = await res.text();
    let data: unknown = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }

    if (!res.ok) {
        const message =
            typeof data === 'object' && data !== null && 'message' in data
                ? String((data as { message: unknown }).message)
                : typeof data === 'string' && data.length > 0
                  ? data
                  : `HTTP Error ${res.status}`;
        throw new Error(message);
    }

    return data as T;
}

export const shipperService = {
    // 1. SHIPPERS & DISPATCH
    getShippers: async (status = '', area = ''): Promise<ShipperDto[]> => {
        const params = new URLSearchParams();
        if (status) params.set('status', status);
        if (area) params.set('area', area);
        const [shippers, orders] = await Promise.all([
            fetch(`/api/Shippers?${params.toString()}`).then((r) => handleResponse<ShipperDto[]>(r)),
            fetch('/api/PhysicalOrders')
                .then((r) => (r.ok ? r.json() : []))
                .catch(() => []),
        ]);

        if (Array.isArray(orders) && orders.length > 0) {
            const inactiveStatuses = new Set(['completed', 'failed', 'returned']);
            return shippers.map((s) => {
                const count = orders.filter((o: Record<string, unknown>) => {
                    const sid = Number(o.shipperId ?? o.ShipperId ?? 0);
                    const st = String(o.status ?? o.Status ?? '').toLowerCase();
                    return sid === s.id && !inactiveStatuses.has(st);
                }).length;
                return {
                    ...s,
                    activeOrdersCount: count,
                };
            });
        }

        return shippers;
    },

    createShipper: (payload: Omit<ShipperDto, 'id' | 'activeOrdersCount'>) =>
        fetch('/api/Shippers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }).then((r) => handleResponse<{ message: string }>(r)),

    updateShipper: (id: number, payload: Omit<ShipperDto, 'id' | 'activeOrdersCount'>) =>
        fetch(`/api/Shippers/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }).then((r) => handleResponse<{ message: string }>(r)),

    updateShipperStatus: (id: number, status: string) =>
        fetch(`/api/Shippers/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        }).then((r) => handleResponse<{ message: string }>(r)),

    getOrdersByShipper: (shipperId: number) =>
        fetch(`/api/Shippers/${shipperId}/orders`).then((r) =>
            handleResponse<PhysicalOrderSummaryDto[]>(r)
        ),

    assignOrderToShipper: (orderId: number, shipperId: number) =>
        fetch('/api/Shippers/assign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, shipperId }),
        }).then((r) => handleResponse<{ message: string }>(r)),

    unassignOrder: (orderId: number) =>
        fetch(`/api/Shippers/unassign/${orderId}`, { method: 'PUT' }).then((r) =>
            handleResponse<{ message: string }>(r)
        ),

    // 2. PHYSICAL ORDERS & TRACKING
    getPhysicalOrders: (status = '', searchKeyword = '') => {
        const params = new URLSearchParams();
        if (status) params.set('status', status);
        if (searchKeyword) params.set('searchKeyword', searchKeyword);
        return fetch(`/api/PhysicalOrders?${params.toString()}`).then((r) =>
            handleResponse<PhysicalOrderSummaryDto[]>(r)
        );
    },

    getOrderTracking: (orderId: number) =>
        fetch(`/api/PhysicalOrders/${orderId}/tracking`).then((r) =>
            handleResponse<OrderTrackingDetailDto>(r)
        ),

    updatePhysicalOrderStatus: (orderId: number, newStatus: string) =>
        fetch(`/api/PhysicalOrders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newStatus }),
        }).then((r) => handleResponse<{ message: string }>(r)),
};

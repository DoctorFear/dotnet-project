// API Service cho 6 Use Case của Vũ Sang (UC24, UC30, UC31, UC32, UC33, UC35)

export interface SupplierDto {
    id: number;
    name: string;
    taxCode: string;
    address: string;
    phone: string;
    email: string;
    contactPerson: string;
    status: string;
    createdAt: string;
}

export interface CreateSupplierPayload {
    name: string;
    taxCode: string;
    address: string;
    phone: string;
    email: string;
    contactPerson: string;
    status?: string;
}

export interface PurchaseOrderItemDto {
    id: number;
    bookId: number;
    bookTitle: string;
    isbn: string;
    orderedQuantity: number;
    receivedQuantity: number;
    unitPrice: number;
    lineTotal: number;
}

export interface PurchaseOrderDto {
    id: number;
    code: string;
    supplierId: number;
    supplierName: string;
    status: string; // Draft, Pending, Approved, Cancelled
    totalAmount: number;
    notes: string;
    cancelReason?: string;
    approvedBy?: string;
    approvedAt?: string;
    createdAt: string;
    createdBy?: string;
    items: PurchaseOrderItemDto[];
}

export interface CreatePurchaseOrderPayload {
    supplierId: number;
    notes: string;
    isDraft: boolean;
    items: {
        bookId: number;
        orderedQuantity: number;
        unitPrice: number;
    }[];
}

export interface StockAlertDto {
    id: number;
    bookId: number;
    bookTitle: string;
    isbn: string;
    currentStock: number;
    minThreshold: number;
    status: string; // LowStock, OutOfStock
    isResolved: boolean;
    createdAt: string;
}

export interface StockMovementDto {
    id: number;
    bookId: number;
    bookTitle: string;
    isbn: string;
    movementType: string;
    quantityChange: number;
    stockBefore: number;
    stockAfter: number;
    reason: string;
    createdAt: string;
    createdBy?: string;
}

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

export interface SimpleBookOption {
    id: number;
    title: string;
    isbn: string;
    physicalPrice: number;
    stockCount: number;
    reorderLevel?: number;
}

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

export const warehouseLogisticsApi = {
    // ==================== 1. SUPPLIERS (UC30) ====================
    getSuppliers: (searchKeyword = '', status = '') => {
        const params = new URLSearchParams();
        if (searchKeyword) params.set('searchKeyword', searchKeyword);
        if (status) params.set('status', status);
        return fetch(`/api/Suppliers?${params.toString()}`).then((r) => handleResponse<SupplierDto[]>(r));
    },

    createSupplier: (payload: CreateSupplierPayload) =>
        fetch('/api/Suppliers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }).then((r) => handleResponse<SupplierDto>(r)),

    updateSupplier: (id: number, payload: CreateSupplierPayload) =>
        fetch(`/api/Suppliers/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }).then((r) => handleResponse<{ message: string }>(r)),

    updateSupplierStatus: (id: number, status: string) =>
        fetch(`/api/Suppliers/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        }).then((r) => handleResponse<{ message: string }>(r)),

    // ==================== 2. PURCHASE ORDERS (UC31 & UC32) ====================
    getPurchaseOrders: (status = '', supplierId?: number, searchKeyword = '') => {
        const params = new URLSearchParams();
        if (status) params.set('status', status);
        if (supplierId) params.set('supplierId', String(supplierId));
        if (searchKeyword) params.set('searchKeyword', searchKeyword);
        return fetch(`/api/PurchaseOrders?${params.toString()}`).then((r) =>
            handleResponse<PurchaseOrderDto[]>(r)
        );
    },

    createPurchaseOrder: (payload: CreatePurchaseOrderPayload) =>
        fetch('/api/PurchaseOrders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }).then((r) => handleResponse<PurchaseOrderDto>(r)),

    approvePurchaseOrder: (
        id: number,
        payload?: { notes?: string; receivedItems?: { bookId: number; receivedQuantity: number }[] }
    ) =>
        fetch(`/api/PurchaseOrders/${id}/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload ?? { receivedItems: [] }),
        }).then((r) => handleResponse<{ message: string; data: PurchaseOrderDto }>(r)),

    cancelPurchaseOrder: (id: number, cancelReason: string) =>
        fetch(`/api/PurchaseOrders/${id}/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cancelReason }),
        }).then((r) => handleResponse<{ message: string }>(r)),

    // ==================== 3. INVENTORY ALERTS & MOVEMENTS (UC33) ====================
    getActiveAlerts: () =>
        fetch('/api/Inventory/alerts/active').then((r) => handleResponse<StockAlertDto[]>(r)),

    scanStockAlerts: () =>
        fetch('/api/Inventory/alerts/scan', { method: 'POST' }).then((r) =>
            handleResponse<StockAlertDto[]>(r)
        ),

    resolveAlert: (id: number) =>
        fetch(`/api/Inventory/alerts/${id}/resolve`, { method: 'PUT' }).then((r) =>
            handleResponse<{ message: string }>(r)
        ),

    updateThreshold: (bookId: number, newThreshold: number) =>
        fetch('/api/Inventory/threshold', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookId, newThreshold }),
        }).then((r) => handleResponse<{ message: string }>(r)),

    getStockMovements: (bookId?: number, movementType = '') => {
        const params = new URLSearchParams();
        if (bookId) params.set('bookId', String(bookId));
        if (movementType) params.set('movementType', movementType);
        return fetch(`/api/Inventory/movements?${params.toString()}`).then((r) =>
            handleResponse<StockMovementDto[]>(r)
        );
    },

    // ==================== 4. SHIPPERS & DISPATCH (UC35) ====================
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

    // ==================== 5. PHYSICAL ORDERS & TRACKING (UC24) ====================
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

    // Helper: lấy danh sách sách kèm tồn kho thực tế từ Inventories
    getBooksForSelect: async (): Promise<SimpleBookOption[]> => {
        try {
            const stockRes = await fetch('/api/Inventory/stocks');
            if (stockRes.ok) {
                const stocks = await stockRes.json();
                if (Array.isArray(stocks) && stocks.length > 0) {
                    return stocks.map((s: Record<string, unknown>) => ({
                        id: Number(s.bookId ?? s.BookId ?? 0),
                        title: String(s.bookTitle ?? s.BookTitle ?? ''),
                        isbn: String(s.isbn ?? s.Isbn ?? ''),
                        physicalPrice: Number(s.physicalPrice ?? s.PhysicalPrice ?? 85000),
                        stockCount: Number(s.quantityOnHand ?? s.QuantityOnHand ?? 0),
                        reorderLevel: Number(s.reorderLevel ?? s.ReorderLevel ?? 5),
                    }));
                }
            }
        } catch {
            // fallback to /api/Book below
        }

        try {
            const [res, alertsRes] = await Promise.all([
                fetch('/api/Book?PageIndex=1&PageSize=100'),
                fetch('/api/Inventory/alerts/active'),
            ]);
            const json = await res.json();
            const alertsJson = alertsRes.ok ? await alertsRes.json() : [];
            const thresholdMap = new Map<number, number>();
            if (Array.isArray(alertsJson)) {
                alertsJson.forEach((a: Record<string, unknown>) => {
                    const bid = Number(a.bookId ?? a.BookId ?? 0);
                    const minT = Number(a.minThreshold ?? a.MinThreshold ?? 5);
                    if (bid > 0) thresholdMap.set(bid, minT);
                });
            }

            const items = json?.data?.items ?? json?.items ?? (Array.isArray(json) ? json : []);
            return items.map((b: Record<string, unknown>) => {
                const id = Number(b.id ?? b.Id ?? 0);
                return {
                    id,
                    title: String(b.title ?? b.Title ?? ''),
                    isbn: String(b.isbn ?? b.Isbn ?? ''),
                    physicalPrice: Number(b.physicalPrice ?? b.PhysicalPrice ?? 80000),
                    stockCount: Number(b.stockCount ?? b.StockCount ?? 0),
                    reorderLevel: thresholdMap.get(id) ?? 5,
                };
            });
        } catch {
            return [];
        }
    },
};

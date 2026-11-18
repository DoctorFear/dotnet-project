import type {
    SupplierDto,
    CreateSupplierPayload,
    PurchaseOrderDto,
    CreatePurchaseOrderPayload,
    StockAlertDto,
    StockMovementDto,
    SimpleBookOption,
} from '../types/warehouse';

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

export const warehouseService = {
    // 1. SUPPLIERS
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

    // 2. PURCHASE ORDERS
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

    // 3. INVENTORY ALERTS & MOVEMENTS
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
            // fallback below
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

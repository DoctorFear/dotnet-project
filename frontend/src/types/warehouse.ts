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

export interface SimpleBookOption {
    id: number;
    title: string;
    isbn: string;
    physicalPrice: number;
    stockCount: number;
    reorderLevel?: number;
}

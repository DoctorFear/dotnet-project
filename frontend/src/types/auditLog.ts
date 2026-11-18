export type AuditLogCategory = 'AUTH' | 'SETTING' | 'INVENTORY' | 'ORDER';

export interface AuditLogFilterDto {
    keyword?: string;
    module?: string;
    role?: string;
    fromDate?: string;
    toDate?: string;
    pageNumber: number;
    pageSize: number;
}

export interface AuditLogItemDto {
    id: number;
    timestamp: string;
    userId?: number | null;
    performerUsername: string;
    performerEmail: string;
    performerFullName: string;
    performerRole: string;
    action: string;
    module: string;
    entityName: string;
    recordId?: string | null;
    oldValues?: string | null;
    newValues?: string | null;
    details?: string | null;
    ipAddress?: string | null;
}

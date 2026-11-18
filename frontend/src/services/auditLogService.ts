import { requestApi } from './apiClient';
import type { ApiResponse } from '../types/user';
import type { PagedResult } from '../types/adminUser';
import type { AuditLogFilterDto, AuditLogItemDto } from '../types/auditLog';

const BASE_PATH = '/admin/audit-logs';

export const auditLogService = {
    // GET /api/admin/audit-logs (Truy vấn nhật ký kiểm toán)
    getAuditLogs: async (filter: AuditLogFilterDto): Promise<ApiResponse<PagedResult<AuditLogItemDto>>> => {
        const params = new URLSearchParams();
        if (filter.keyword && filter.keyword.trim()) {
            params.append('Keyword', filter.keyword.trim());
        }
        if (filter.module) {
            params.append('Module', filter.module);
        }
        if (filter.fromDate) {
            params.append('FromDate', filter.fromDate);
        }
        if (filter.toDate) {
            params.append('ToDate', filter.toDate);
        }
        params.append('PageNumber', filter.pageNumber.toString());
        params.append('PageSize', filter.pageSize.toString());

        return requestApi<ApiResponse<PagedResult<AuditLogItemDto>>>(
            `${BASE_PATH}?${params.toString()}`,
            { method: 'GET' }
        );
    },
};

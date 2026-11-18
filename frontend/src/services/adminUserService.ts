import { requestApi } from './apiClient';
import type {
    ApiResponse,
    ChangeUserRoleRequest,
    CreateInternalUserRequest,
    PagedResult,
    ToggleUserStatusRequest,
    UserFilterParams,
    UserManagementItem,
} from '../types/adminUser';

const BASE_PATH = '/admin/users';

export const adminUserService = {
    getUsers(params: UserFilterParams): Promise<ApiResponse<PagedResult<UserManagementItem>>> {
        const query = new URLSearchParams();
        if (params.keyword?.trim()) query.set('Keyword', params.keyword.trim());
        if (params.role) query.set('Role', params.role);
        if (typeof params.isActive === 'boolean') query.set('IsActive', String(params.isActive));
        query.set('PageNumber', String(params.pageNumber ?? 1));
        query.set('PageSize', String(params.pageSize ?? 8));

        return requestApi<ApiResponse<PagedResult<UserManagementItem>>>(
            `${BASE_PATH}?${query.toString()}`,
            { method: 'GET' }
        );
    },

    createInternalUser(
        request: CreateInternalUserRequest
    ): Promise<ApiResponse<UserManagementItem>> {
        return requestApi<ApiResponse<UserManagementItem>>(BASE_PATH, {
            method: 'POST',
            body: JSON.stringify(request),
        });
    },

    updateRole(
        userId: number,
        request: ChangeUserRoleRequest
    ): Promise<ApiResponse<boolean>> {
        return requestApi<ApiResponse<boolean>>(`${BASE_PATH}/${userId}/role`, {
            method: 'PATCH',
            body: JSON.stringify(request),
        });
    },

    toggleStatus(
        userId: number,
        request: ToggleUserStatusRequest
    ): Promise<ApiResponse<boolean>> {
        return requestApi<ApiResponse<boolean>>(`${BASE_PATH}/${userId}/status`, {
            method: 'PATCH',
            body: JSON.stringify(request),
        });
    },
};
import { requestApi } from './apiClient';
import type { ApiResponse } from '../types/user';
import type {
    UserFilterDto,
    UserFilterParams,
    UserManagementItemDto,
    CreateInternalUserRequestDto,
    CreateInternalUserRequest,
    ChangeUserRoleRequestDto,
    ChangeUserRoleRequest,
    ToggleUserStatusRequestDto,
    ToggleUserStatusRequest,
    PagedResult,
} from '../types/adminUser';

const BASE_PATH = '/admin/users';

export const adminUserService = {
    // 1. GET /api/admin/users (Lọc, tìm kiếm & phân trang)
    getUsers: async (
        filter: UserFilterDto | UserFilterParams
    ): Promise<ApiResponse<PagedResult<UserManagementItemDto>>> => {
        const params = new URLSearchParams();
        if (filter.keyword && filter.keyword.trim()) {
            params.append('Keyword', filter.keyword.trim());
        }
        if (filter.role) {
            params.append('Role', filter.role.toString());
        }
        if (filter.isActive !== undefined) {
            params.append('IsActive', filter.isActive.toString());
        }
        params.append('PageNumber', (filter.pageNumber ?? 1).toString());
        params.append('PageSize', (filter.pageSize ?? 10).toString());

        return requestApi<ApiResponse<PagedResult<UserManagementItemDto>>>(
            `${BASE_PATH}?${params.toString()}`,
            { method: 'GET' }
        );
    },

    // 2. POST /api/admin/users (Tạo nhân sự mới)
    createInternalUser: async (
        payload: CreateInternalUserRequestDto | CreateInternalUserRequest
    ): Promise<ApiResponse<UserManagementItemDto>> => {
        return requestApi<ApiResponse<UserManagementItemDto>>(BASE_PATH, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    // 3. PATCH /api/admin/users/{id}/role (Cập nhật vai trò)
    updateRole: async (
        id: number,
        payload: ChangeUserRoleRequestDto | ChangeUserRoleRequest
    ): Promise<ApiResponse<boolean>> => {
        return requestApi<ApiResponse<boolean>>(`${BASE_PATH}/${id}/role`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });
    },

    // 4. PATCH /api/admin/users/{id}/status (Khóa hoặc mở khóa tài khoản)
    toggleStatus: async (
        id: number,
        payload: ToggleUserStatusRequestDto | ToggleUserStatusRequest
    ): Promise<ApiResponse<boolean>> => {
        return requestApi<ApiResponse<boolean>>(`${BASE_PATH}/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });
    },
};

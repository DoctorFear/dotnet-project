import { requestApi } from './apiClient';
import type { ApiResponse } from '../types/user';
import type {
    UserFilterDto,
    UserManagementItemDto,
    CreateInternalUserRequestDto,
    ChangeUserRoleRequestDto,
    ToggleUserStatusRequestDto,
    PagedResult
} from '../types/adminUser';

export const adminUserService = {
    // 1. GET /api/admin/users (Lọc, tìm kiếm & phân trang)
    getUsers: async (filter: UserFilterDto): Promise<ApiResponse<PagedResult<UserManagementItemDto>>> => {
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
        params.append('PageNumber', filter.pageNumber.toString());
        params.append('PageSize', filter.pageSize.toString());

        return requestApi<ApiResponse<PagedResult<UserManagementItemDto>>>(`/admin/users?${params.toString()}`, {
            method: 'GET'
        });
    },

    // 2. POST /api/admin/users (Tạo nhân sự mới)
    createInternalUser: async (payload: CreateInternalUserRequestDto): Promise<ApiResponse<UserManagementItemDto>> => {
        return requestApi<ApiResponse<UserManagementItemDto>>('/admin/users', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    // 3. PATCH /api/admin/users/{id}/role (Cập nhật vai trò)
    updateRole: async (id: number, payload: ChangeUserRoleRequestDto): Promise<ApiResponse<boolean>> => {
        return requestApi<ApiResponse<boolean>>(`/admin/users/${id}/role`, {
            method: 'PATCH',
            body: JSON.stringify(payload)
        });
    },

    // 4. PATCH /api/admin/users/{id}/status (Khóa hoặc mở khóa tài khoản)
    toggleStatus: async (id: number, payload: ToggleUserStatusRequestDto): Promise<ApiResponse<boolean>> => {
        return requestApi<ApiResponse<boolean>>(`/admin/users/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify(payload)
        });
    }
};

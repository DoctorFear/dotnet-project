export type UserRoleType = 'Admin' | 'Staff' | 'Shipper' | 'Member';
export type InternalUserRole = 'Admin' | 'Staff' | 'Shipper';

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
}

export interface PagedResult<T> {
    items: T[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
}

export interface UserManagementItem {
    id: number;
    username: string;
    email: string;
    fullName: string;
    phoneNumber: string | null;
    role: UserRoleType;
    isActive: boolean;
    createdAt: string;
    isSuperAdmin: boolean;
}

export interface UserFilterParams {
    keyword?: string;
    role?: UserRoleType | '';
    isActive?: boolean;
    pageNumber?: number;
    pageSize?: number;
}

export interface CreateInternalUserRequest {
    username: string;
    email: string;
    fullName: string;
    phoneNumber: string;
    role: InternalUserRole;
}

export interface ChangeUserRoleRequest {
    newRole: InternalUserRole;
}

export interface ToggleUserStatusRequest {
    isActive: boolean;
}

export interface CreateUserFormErrors {
    username?: string;
    email?: string;
    fullName?: string;
    phoneNumber?: string;
    role?: string;
}
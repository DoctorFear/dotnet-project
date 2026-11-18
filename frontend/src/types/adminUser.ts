export enum UserRoleEnum {
    Member = 1,
    Staff = 2,
    Shipper = 3,
    Admin = 4
}

export type UserRoleType = 'Member' | 'Staff' | 'Shipper' | 'Admin';
export type InternalUserRole = 'Admin' | 'Staff' | 'Shipper';

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
}

// Query lọc & phân trang danh sách người dùng
export interface UserFilterDto {
    keyword?: string;
    role?: UserRoleEnum;
    isActive?: boolean;
    pageNumber: number;
    pageSize: number;
}

export interface UserFilterParams {
    keyword?: string;
    role?: UserRoleType | '';
    isActive?: boolean;
    pageNumber?: number;
    pageSize?: number;
}

// Model thông tin người dùng hiển thị trên bảng
export interface UserManagementItemDto {
    id: number;
    username: string;
    email: string;
    fullName: string;
    phoneNumber?: string | null;
    role: string;
    isActive: boolean;
    createdAt: string;
    isSuperAdmin: boolean;
}

export type UserManagementItem = UserManagementItemDto;

// Request tạo nhân sự mới (chỉ 3 vai trò nội bộ)
export interface CreateInternalUserRequestDto {
    username: string;
    email: string;
    fullName: string;
    phoneNumber: string;
    role: UserRoleEnum;
}

export interface CreateInternalUserRequest {
    username: string;
    email: string;
    fullName: string;
    phoneNumber: string;
    role: InternalUserRole;
}

// Request chuyển đổi vai trò
export interface ChangeUserRoleRequestDto {
    newRole: UserRoleEnum;
}

export interface ChangeUserRoleRequest {
    newRole: InternalUserRole;
}

// Request Khóa / Mở khóa tài khoản
export interface ToggleUserStatusRequestDto {
    isActive: boolean;
}

export interface ToggleUserStatusRequest {
    isActive: boolean;
}

// Cấu trúc phân trang trả về từ Backend
export interface PagedResult<T> {
    items: T[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
}

export interface CreateUserFormErrors {
    username?: string;
    email?: string;
    fullName?: string;
    phoneNumber?: string;
    role?: string;
}

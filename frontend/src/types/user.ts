export type UserRole = 'Member' | 'Staff' | 'Shipper' | 'Admin';

export interface UserInfo {
    id: number;
    username: string;
    email: string;
    fullName: string;
    role: UserRole;
    fPoints: number;
    avatarUrl?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T | null;
}

// --- DTOs Phân hệ Xác thực (Auth) ---
export interface LoginRequestDto {
    username: string;
    password: string;
}

export interface LoginResponseDto {
    userId: number;
    username: string;
    email: string;
    fullName: string;
    role: UserRole;
    fPoints: number;
    accessToken: string;
    refreshToken: string;
}

export interface RegisterRequestDto {
    fullName: string;
    username: string;
    email: string;
    phoneNumber?: string;
    password: string;
    confirmPassword: string;
}

export interface RegisterResponseDto {
    userId: number;
    username: string;
    email: string;
    fullName: string;
    role: string;
    fPoints: number;
    createdAt: string;
}

export interface ForgotPasswordRequestDto {
    username: string;
    email: string;
}

export interface ResetPasswordRequestDto {
    token: string;
    newPassword: string;
    confirmPassword: string;
}

// --- DTOs Phân hệ Quản lý Hồ sơ & Mật khẩu (User Profile) ---
export interface AddressDto {
    id?: number;
    province: string;
    ward: string;
    streetAddress: string;
    isDefault: boolean;
}

export interface UserProfileResponseDto {
    id: number;
    username: string;
    email: string;
    fullName: string;
    phoneNumber: string;
    role: string;
    hasPassword: boolean;
    addresses: AddressDto[];
}

export interface UpdateProfileRequestDto {
    fullName: string;
    email: string;
    phoneNumber: string;
    addresses?: AddressDto[];
}

export interface ChangePasswordRequestDto {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}
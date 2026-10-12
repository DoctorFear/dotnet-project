export type UserRole = 'Member' | 'Staff' | 'Shipper' | 'Admin';

export interface UserInfo {
    id: number;
    username: string;
    email: string;
    fullName: string;
    role: UserRole;
    fPoints: number; // Khớp từ backend LoginResponseDto
    avatarUrl?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T | null;
}

// Khớp AncientBook.Application.DTOs.Auth.LoginRequestDto
export interface LoginRequestDto {
    username: string;
    password: string;
}

// Khớp AncientBook.Application.DTOs.Auth.LoginResponseDto
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

// Khớp AncientBook.Application.DTOs.Auth.RegisterRequestDto
export interface RegisterRequestDto {
    fullName: string;
    username: string;
    email: string;
    phoneNumber?: string;
    password: string;
    confirmPassword: string; // Backend bắt buộc có trường này để validate [Compare]
}

// Khớp AncientBook.Application.DTOs.Auth.RegisterResponseDto
export interface RegisterResponseDto {
    userId: number;
    username: string;
    email: string;
    fullName: string;
    role: string;
    fPoints: number;
    createdAt: string;
}
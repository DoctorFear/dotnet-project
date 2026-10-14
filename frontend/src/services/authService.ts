import { requestApi } from './apiClient';
import type { 
    ApiResponse, 
    LoginRequestDto, 
    LoginResponseDto, 
    RegisterRequestDto, 
    RegisterResponseDto,
    ForgotPasswordRequestDto,
    ResetPasswordRequestDto
} from '../types/user';

export const authService = {
    login: async (payload: LoginRequestDto): Promise<ApiResponse<LoginResponseDto>> => {
        return requestApi<ApiResponse<LoginResponseDto>>('/Auth/login', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    register: async (payload: RegisterRequestDto): Promise<ApiResponse<RegisterResponseDto>> => {
        return requestApi<ApiResponse<RegisterResponseDto>>('/Auth/register', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    logout: async (): Promise<ApiResponse<boolean>> => {
        return requestApi<ApiResponse<boolean>>('/Auth/logout', {
            method: 'POST',
        });
    },

    refreshToken: async (refreshToken: string): Promise<ApiResponse<LoginResponseDto>> => {
        return requestApi<ApiResponse<LoginResponseDto>>('/Auth/refresh-token', {
            method: 'POST',
            body: JSON.stringify({ refreshToken }),
        });
    },

    // Quên mật khẩu: Gửi email chứa liên kết xác nhận
    forgotPassword: async (payload: ForgotPasswordRequestDto): Promise<ApiResponse<boolean>> => {
        return requestApi<ApiResponse<boolean>>('/Auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    // Đặt lại mật khẩu mới thông qua Token từ email
    resetPassword: async (payload: ResetPasswordRequestDto): Promise<ApiResponse<boolean>> => {
        return requestApi<ApiResponse<boolean>>('/Auth/reset-password', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }
};
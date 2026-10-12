import { requestApi } from './apiClient';
import type { 
    ApiResponse, 
    LoginRequestDto, 
    LoginResponseDto, 
    RegisterRequestDto, 
    RegisterResponseDto 
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
    }
};
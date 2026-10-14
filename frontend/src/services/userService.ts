import { requestApi } from './apiClient';
import type {
    ApiResponse,
    UserProfileResponseDto,
    UpdateProfileRequestDto,
    ChangePasswordRequestDto
} from '../types/user';

export const userService = {
    // GET: /api/User/profile
    getProfile: async (): Promise<ApiResponse<UserProfileResponseDto>> => {
        return requestApi<ApiResponse<UserProfileResponseDto>>('/User/profile', {
            method: 'GET'
        });
    },

    // PUT: /api/User/profile
    updateProfile: async (payload: UpdateProfileRequestDto): Promise<ApiResponse<UserProfileResponseDto>> => {
        return requestApi<ApiResponse<UserProfileResponseDto>>('/User/profile', {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
    },

    // POST: /api/User/change-password
    changePassword: async (payload: ChangePasswordRequestDto): Promise<ApiResponse<boolean>> => {
        return requestApi<ApiResponse<boolean>>('/User/change-password', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }
};
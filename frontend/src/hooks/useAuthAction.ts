import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useUser } from '../context/UserContext';
import { useToastNotifications } from './useToastNotifications';
import type { LoginRequestDto, RegisterRequestDto } from '../types/user';

export const useAuthAction = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const { loginSuccess, logoutClient } = useUser();
    const { toasts, notify, dismissToast } = useToastNotifications();
    const navigate = useNavigate();

const handleLogin = async (payload: LoginRequestDto) => {
        setIsLoading(true);
        try {
            const res = await authService.login(payload);
            const authData = res.data;

            if (res.success && authData) {
                loginSuccess(authData);
                notify('Đăng nhập thành công!', 'success');
                setTimeout(() => {
                    // Trong handleLogin của useAuthAction.ts:
                    if (authData.role === 'Admin') {
                        navigate('/admin/settings');
                    } else if (authData.role === 'Staff') {
                        navigate('/staff/books');
                    } else if (authData.role === 'Shipper') {
                        navigate('/shipper/orders');
                    } else {
                        // Member
                        navigate('/');
                    }
                }, 400);
            } else {
                notify(res.message || 'Đăng nhập thất bại.', 'error');
            }
        } catch (err: any) {
            notify(err.message || 'Lỗi kết nối máy chủ.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (payload: RegisterRequestDto) => {
        setIsLoading(true);
        try {
            const res = await authService.register(payload);
            if (res.success) {
                notify('Đăng ký tài khoản thành công! Vui lòng đăng nhập.', 'success');
                setTimeout(() => navigate('/login'), 700);
            } else {
                notify(res.message || 'Đăng ký thất bại.', 'error');
            }
        } catch (err: any) {
            notify(err.message || 'Lỗi kết nối máy chủ.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        setIsLoading(true);
        try {
            await authService.logout();
        } catch {
            // Dù API logout lỗi mạng vẫn xóa phiên ở client
        } finally {
            logoutClient();
            notify('Đã đăng xuất khỏi hệ thống.', 'success');
            navigate('/login');
            setIsLoading(false);
        }
    };

    return {
        isLoading,
        toasts,
        notify,
        dismissToast,
        handleLogin,
        handleRegister,
        handleLogout
    };
};
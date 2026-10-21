import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useUser } from '../context/UserContext';
import { useToastNotifications } from './useToastNotifications';
import type { 
    LoginRequestDto, 
    RegisterRequestDto, 
    ForgotPasswordRequestDto, 
    ResetPasswordRequestDto 
} from '../types/user';

export const useAuthAction = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const { loginSuccess, logoutClient } = useUser();
    const { toasts, notify, dismissToast } = useToastNotifications();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogin = async (payload: LoginRequestDto) => {
        setIsLoading(true);
        try {
            const res = await authService.login(payload);
            const authData = res.data;

            if (res.success && authData) {
                loginSuccess(authData);
                notify('Đăng nhập thành công!', 'success');
                setTimeout(() => {
                    if (authData.role === 'Admin') {
                        navigate('/admin/settings');
                    } else if (authData.role === 'Staff') {
                        navigate('/staff/books');
                    } else if (authData.role === 'Shipper') {
                        navigate('/shipper/orders');
                    } else {
                        const from = location.state?.from;
                        const pathname = typeof from?.pathname === 'string' ? from.pathname : '/';
                        const allowed = pathname === '/' || pathname === '/wishlist' || /^\/books\/\d+$/.test(pathname);
                        navigate(allowed ? pathname + (typeof from?.search === 'string' ? from.search : '') : '/');
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
            navigate('/', { replace: true });
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async (payload: ForgotPasswordRequestDto) => {
        setIsLoading(true);
        try {
            const res = await authService.forgotPassword(payload);
            if (res.success) {
                notify(res.message || 'Liên kết đặt lại mật khẩu đã được gửi về email của bạn. Vui lòng kiểm tra hộp thư.', 'success');
            } else {
                notify(res.message || 'Không thể gửi yêu cầu đặt lại mật khẩu.', 'error');
            }
        } catch (err: any) {
            notify(err.message || 'Lỗi kết nối máy chủ.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (payload: ResetPasswordRequestDto) => {
        setIsLoading(true);
        try {
            const res = await authService.resetPassword(payload);
            if (res.success) {
                notify(res.message || 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.', 'success');
                setTimeout(() => navigate('/login'), 1200);
            } else {
                notify(res.message || 'Đặt lại mật khẩu thất bại.', 'error');
            }
        } catch (err: any) {
            notify(err.message || 'Lỗi kết nối máy chủ.', 'error');
        } finally {
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
        handleLogout,
        handleForgotPassword,
        handleResetPassword
    };
};

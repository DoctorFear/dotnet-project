import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthAction } from '../hooks/useAuthAction';
import { authService } from '../services/authService';
import { ToastNotification } from '../components/common/ToastNotification';
import { TopBar } from '../components/layout/TopBar';
import { Header } from '../components/layout/Header';
import { AuthVisualSide } from '../components/features/auth/AuthVisualSide';
import { ResetPasswordForm } from '../components/features/auth/ResetPasswordForm';
import styles from './ResetPasswordPage.module.css';

export const ResetPasswordPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';

    const [isVerifyingToken, setIsVerifyingToken] = useState<boolean>(true);
    const [tokenError, setTokenError] = useState<string | null>(null);

    const { isLoading, toasts, dismissToast, notify, handleResetPassword } = useAuthAction();

    useEffect(() => {
        let isMounted = true;

        if (!token) {
            setTokenError('Liên kết khôi phục không hợp lệ hoặc thiếu mã xác thực.');
            setIsVerifyingToken(false);
            notify('Liên kết khôi phục không hợp lệ.', 'error');
            return;
        }

        const checkToken = async () => {
            try {
                const res = await authService.verifyResetToken(token);
                if (!isMounted) return;

                if (!res.success) {
                    setTokenError(res.message || 'Liên kết đặt lại mật khẩu đã hết hạn (quá 15 phút) hoặc không hợp lệ.');
                    notify(res.message || 'Liên kết đã hết hạn hoặc không hợp lệ.', 'error');
                } else {
                    setTokenError(null);
                }
            } catch (err: any) {
                if (!isMounted) return;
                const errorMsg = err.message || 'Liên kết đặt lại mật khẩu đã hết hạn (quá 15 phút) hoặc không hợp lệ.';
                setTokenError(errorMsg);
                notify(errorMsg, 'error');
            } finally {
                if (isMounted) setIsVerifyingToken(false);
            }
        };

        checkToken();

        return () => {
            isMounted = false;
        };
    }, [token]);

    return (
        <div className={styles.resetPasswordPageWrapper}>
            <ToastNotification toasts={toasts} onClose={dismissToast} />
            <TopBar />
            <Header showSearch={false} />

            <main className={styles.mainWrapper}>
                <div className={styles.bookCard}>
                    <AuthVisualSide
                        kicker="Thiết lập mật mã"
                        quote="Một mật khẩu an toàn sẽ bảo vệ tủ sách và dữ liệu cá nhân của bạn trên mọi hành trình."
                        author="Nguyễn Ngọc Vũ Sang"
                    />
                    <ResetPasswordForm
                        token={token}
                        isVerifyingToken={isVerifyingToken}
                        tokenError={tokenError}
                        onSubmit={handleResetPassword}
                        isLoading={isLoading}
                    />
                </div>
            </main>
        </div>
    );
};

export default ResetPasswordPage;

import React from 'react';
import { useAuthAction } from '../hooks/useAuthAction';
import { ToastNotification } from '../components/common/ToastNotification';
import { TopBar } from '../components/layout/TopBar';
import { Header } from '../components/layout/Header';
import { AuthVisualSide } from '../components/features/auth/AuthVisualSide';
import { ForgotPasswordForm } from '../components/features/auth/ForgotPasswordForm';
import styles from './ForgotPasswordPage.module.css';

export const ForgotPasswordPage: React.FC = () => {
    const { isLoading, toasts, dismissToast, handleForgotPassword } = useAuthAction();

    return (
        <div className={styles.forgotPasswordPageWrapper}>
            <ToastNotification toasts={toasts} onClose={dismissToast} />
            <TopBar />
            <Header showSearch={false} />

            <main className={styles.mainWrapper}>
                <div className={styles.bookCard}>
                    <AuthVisualSide
                        kicker="Bảo mật tài khoản"
                        quote="Sách là tài sản của tâm hồn, và sự an toàn của độc giả luôn là ưu tiên hàng đầu tại ancientBOOK."
                        author="Phạm Nguyễn Thanh Sang"
                    />
                    <ForgotPasswordForm onSubmit={handleForgotPassword} isLoading={isLoading} />
                </div>
            </main>
        </div>
    );
};

export default ForgotPasswordPage;

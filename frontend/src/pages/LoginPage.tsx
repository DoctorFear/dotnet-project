import React from 'react';
import { useAuthAction } from '../hooks/useAuthAction';
import { ToastNotification } from '../components/common/ToastNotification';
import { TopBar } from '../components/layout/TopBar';
import { Header } from '../components/layout/Header';
import { AuthVisualSide } from '../components/features/auth/AuthVisualSide';
import { LoginForm } from '../components/features/auth/LoginForm';
import styles from './LoginPage.module.css';

export const LoginPage: React.FC = () => {
    const { isLoading, toasts, dismissToast, handleLogin } = useAuthAction();

    return (
        <div className={styles.loginPageWrapper}>
            <ToastNotification toasts={toasts} onClose={dismissToast} />
            <TopBar />
            <Header showSearch={false} />

            <main className={styles.mainWrapper}>
                <div className={styles.bookCard}>
                    <AuthVisualSide
                        kicker="Chào mừng trở lại"
                        quote="Sách là nguồn tri thức bất tận, mỗi lần mở trang sách là một lần bước vào một chân trời mới."
                        author="Hà Thái Sơn"
                    />
                    <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
                </div>
            </main>
        </div>
    );
};

export default LoginPage;

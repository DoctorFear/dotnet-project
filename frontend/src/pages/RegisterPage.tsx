import React from 'react';
import { useAuthAction } from '../hooks/useAuthAction';
import { ToastNotification } from '../components/common/ToastNotification';
import { TopBar } from '../components/layout/TopBar';
import { Header } from '../components/layout/Header';
import { AuthVisualSide } from '../components/features/auth/AuthVisualSide';
import { RegisterForm } from '../components/features/auth/RegisterForm';
import styles from './RegisterPage.module.css';

export const RegisterPage: React.FC = () => {
    const { isLoading, toasts, dismissToast, handleRegister } = useAuthAction();

    return (
        <div className={styles.registerPageWrapper}>
            <ToastNotification toasts={toasts} onClose={dismissToast} />
            <TopBar />
            <Header showSearch={false} />

            <main className={styles.mainWrapper}>
                <div className={styles.bookCard}>
                    <AuthVisualSide
                        kicker="Góc độc giả"
                        quote="Một cuốn sách thực sự hay dạy tôi nhiều điều hơn là chỉ đọc nó. Tôi phải nhanh chóng đặt nó xuống, bắt đầu sống theo những gì nó gợi ý."
                        author="Nguyễn Trương Mai Phương"
                    />
                    <RegisterForm onSubmit={handleRegister} isLoading={isLoading} />
                </div>
            </main>
        </div>
    );
};

export default RegisterPage;

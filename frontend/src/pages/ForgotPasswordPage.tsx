import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthAction } from '../hooks/useAuthAction';
import { ToastNotification } from '../components/common/ToastNotification';
import styles from './LoginPage.module.css';

export const ForgotPasswordPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const { isLoading, toasts, dismissToast, notify, handleForgotPassword } = useAuthAction();

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const cleanUsername = username.trim();
        const cleanEmail = email.trim().toLowerCase();

        if (!cleanUsername) {
            notify('Tên đăng nhập không được để trống.', 'error');
            return;
        }

        if (!cleanEmail) {
            notify('Email không được để trống.', 'error');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
            notify('Địa chỉ email không đúng định dạng.', 'error');
            return;
        }

        handleForgotPassword({
            username: cleanUsername,
            email: cleanEmail
        });
    };

    return (
        <div className={styles.authContainer}>
            <ToastNotification toasts={toasts} onClose={dismissToast} />
            <div className={styles.authCard}>
                <div className={styles.brandTitle}>
                    ancient<span>BOOK</span>
                </div>
                <h2 className={styles.formTitle}>Khôi phục mật khẩu</h2>
                <p className={styles.formSubtitle}>Nhập thông tin tài khoản để nhận liên kết xác nhận qua Email</p>

                <form onSubmit={onSubmit} className={styles.form} noValidate>
                    <div className={styles.formGroup}>
                        <label>Tên đăng nhập *</label>
                        <input
                            type="text"
                            placeholder="Nhập tên đăng nhập của bạn"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Email đăng ký *</label>
                        <input
                            type="email"
                            placeholder="example@domain.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                        {isLoading ? 'Đang gửi email...' : 'Gửi liên kết khôi phục'}
                    </button>
                </form>

                <div className={styles.formFooter}>
                    <span>Nhớ lại mật khẩu? </span>
                    <Link to="/login">Đăng nhập</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
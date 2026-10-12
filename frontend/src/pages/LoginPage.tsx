import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthAction } from '../hooks/useAuthAction';
import { ToastNotification } from '../components/common/ToastNotification';
import styles from './LoginPage.module.css';

export const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { isLoading, toasts, dismissToast, handleLogin } = useAuthAction();

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || !password) return;
        handleLogin({ username: username.trim(), password });
    };

    return (
        <div className={styles.authContainer}>
            {/* Sửa onDismiss thành onClose để khớp với ToastProps */}
            <ToastNotification toasts={toasts} onClose={dismissToast} />
            <div className={styles.authCard}>
                <div className={styles.brandTitle}>
                    ancient<span>BOOK</span>
                </div>
                <h2 className={styles.formTitle}>Đăng nhập hệ thống</h2>
                <p className={styles.formSubtitle}>Sử dụng tên đăng nhập và mật khẩu nội bộ</p>

                <form onSubmit={onSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label>Tên đăng nhập</label>
                        <input
                            type="text"
                            placeholder="Nhập tên đăng nhập của bạn"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Mật khẩu</label>
                        <input
                            type="password"
                            placeholder="Nhập mật khẩu"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                        {isLoading ? 'Đang xác thực...' : 'Đăng nhập'}
                    </button>
                </form>

                <div className={styles.formFooter}>
                    <span>Chưa có tài khoản? </span>
                    <Link to="/register">Đăng ký ngay</Link>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
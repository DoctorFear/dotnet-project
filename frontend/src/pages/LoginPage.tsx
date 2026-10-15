import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthAction } from '../hooks/useAuthAction';
import { ToastNotification } from '../components/common/ToastNotification';
import styles from './LoginPage.module.css';

export const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { isLoading, toasts, dismissToast, notify, handleLogin } = useAuthAction();

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedUsername = username.trim();

        // 1. Kiểm tra Username: [Required]
        if (!trimmedUsername) {
            notify('Tên đăng nhập không được để trống', 'error');
            return;
        }

        if (trimmedUsername.length > 50) {
            notify('Tên đăng nhập tối đa 50 ký tự', 'error');
            return;
        }

        // 2. Kiểm tra Password: [Required]
        if (!password) {
            notify('Mật khẩu không được để trống', 'error');
            return;
        }

        // Gửi thông tin đăng nhập đã hợp lệ
        handleLogin({ 
            username: trimmedUsername, 
            password 
        });
    };

    return (
        <div className={styles.authContainer}>
            <ToastNotification toasts={toasts} onClose={dismissToast} />
            <div className={styles.authCard}>
                <div className={styles.brandTitle}>
                    ancient<span>BOOK</span>
                </div>
                <h2 className={styles.formTitle}>Đăng nhập hệ thống</h2>
                <p className={styles.formSubtitle}>Sử dụng tên đăng nhập và mật khẩu nội bộ</p>

                <form onSubmit={onSubmit} className={styles.form} noValidate>
                    <div className={styles.formGroup}>
                        <label>Tên đăng nhập *</label>
                        <input
                            type="text"
                            placeholder="Nhập tên đăng nhập của bạn"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            maxLength={50}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Mật khẩu *</label>
                        <input
                            type="password"
                            placeholder="Nhập mật khẩu"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div style={{ textAlign: 'right', marginTop: '4px', marginBottom: '16px' }}>
                        <Link to="/forgot-password" style={{ fontSize: '13px', color: '#6366f1', textDecoration: 'none' }}>
                            Quên mật khẩu?
                        </Link>
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
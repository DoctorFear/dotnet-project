import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuthAction } from '../hooks/useAuthAction';
import { ToastNotification } from '../components/common/ToastNotification';
import styles from './LoginPage.module.css';

export const ResetPasswordPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';
    const navigate = useNavigate();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { isLoading, toasts, dismissToast, notify, handleResetPassword } = useAuthAction();

    useEffect(() => {
        if (!token) {
            notify('Liên kết khôi phục không hợp lệ hoặc thiếu mã token.', 'error');
            setTimeout(() => navigate('/forgot-password'), 2500);
        }
    }, [token, navigate]);

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) {
            notify('Mã token không hợp lệ.', 'error');
            return;
        }

        if (!newPassword) {
            notify('Mật khẩu mới không được để trống.', 'error');
            return;
        }

        if (newPassword.length < 6) {
            notify('Mật khẩu mới phải có độ dài tối thiểu từ 6 ký tự trở lên.', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            notify('Mật khẩu xác nhận không trùng khớp.', 'error');
            return;
        }

        handleResetPassword({
            token,
            newPassword,
            confirmPassword
        });
    };

    return (
        <div className={styles.authContainer}>
            <ToastNotification toasts={toasts} onClose={dismissToast} />
            <div className={styles.authCard}>
                <div className={styles.brandTitle}>
                    ancient<span>BOOK</span>
                </div>
                <h2 className={styles.formTitle}>Đặt lại mật khẩu</h2>
                <p className={styles.formSubtitle}>Vui lòng thiết lập mật khẩu mới cho tài khoản của bạn</p>

                <form onSubmit={onSubmit} className={styles.form} noValidate>
                    <div className={styles.formGroup}>
                        <label>Mật khẩu mới *</label>
                        <input
                            type="password"
                            placeholder="Tối thiểu 6 ký tự"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Xác nhận mật khẩu mới *</label>
                        <input
                            type="password"
                            placeholder="Nhập lại mật khẩu mới"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={isLoading || !token}>
                        {isLoading ? 'Đang cập nhật...' : 'Xác nhận đặt lại mật khẩu'}
                    </button>
                </form>

                <div className={styles.formFooter}>
                    <span>Quay lại </span>
                    <Link to="/login">Đăng nhập</Link>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
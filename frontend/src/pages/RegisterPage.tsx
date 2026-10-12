import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthAction } from '../hooks/useAuthAction';
import { ToastNotification } from '../components/common/ToastNotification';
import styles from './LoginPage.module.css';

export const RegisterPage: React.FC = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: ''
    });

    const { isLoading, toasts, dismissToast, notify, handleRegister } = useAuthAction();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            notify('Mật khẩu xác nhận không trùng khớp.', 'error');
            return;
        }
        if (formData.password.length < 6) {
            notify('Mật khẩu phải từ 6 ký tự trở lên.', 'error');
            return;
        }

        handleRegister({
            fullName: formData.fullName.trim(),
            username: formData.username.trim(),
            email: formData.email.trim(),
            phoneNumber: formData.phoneNumber.trim() || undefined,
            password: formData.password,
            confirmPassword: formData.confirmPassword
        });
    };

    return (
        <div className={styles.authContainer}>
            {/* Sửa onDismiss thành onClose để khớp với ToastProps */}
            <ToastNotification toasts={toasts} onClose={dismissToast} />
            <div className={styles.authCard}>
                <div className={styles.brandTitle}>
                    ancient<span>BOOK</span>
                </div>
                <h2 className={styles.formTitle}>Đăng ký tài khoản</h2>
                <p className={styles.formSubtitle}>Khởi tạo tài khoản độc giả mới</p>

                <form onSubmit={onSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label>Họ và tên *</label>
                        <input
                            type="text"
                            name="fullName"
                            placeholder="Nhập họ và tên đầy đủ"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Tên đăng nhập *</label>
                        <input
                            type="text"
                            name="username"
                            placeholder="Tối thiểu 3 ký tự (vd: thai_son)"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Email liên hệ (phục vụ khôi phục MK) *</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="example@domain.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Số điện thoại</label>
                        <input
                            type="tel"
                            name="phoneNumber"
                            placeholder="10 chữ số bắt đầu bằng 0 (vd: 0912345678)"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Mật khẩu *</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="Tối thiểu 6 ký tự"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Xác nhận mật khẩu *</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="Nhập lại mật khẩu"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                        {isLoading ? 'Đang tạo tài khoản...' : 'Đăng ký ngay'}
                    </button>
                </form>

                <div className={styles.formFooter}>
                    <span>Đã có tài khoản? </span>
                    <Link to="/login">Đăng nhập</Link>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
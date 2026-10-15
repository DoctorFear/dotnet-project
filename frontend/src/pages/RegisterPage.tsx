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

        const fullName = formData.fullName.trim();
        const username = formData.username.trim();
        const email = formData.email.trim();
        const phoneNumber = formData.phoneNumber.trim();
        const password = formData.password;
        const confirmPassword = formData.confirmPassword;

        // 1. Validate FullName: [Required], [MaxLength(100)]
        if (!fullName) {
            notify('Họ và tên không được để trống', 'error');
            return;
        }
        if (fullName.length > 100) {
            notify('Họ và tên tối đa 100 ký tự', 'error');
            return;
        }

        // 2. Validate Username: [Required], [MinLength(3)], [MaxLength(50)]
        if (!username) {
            notify('Tên đăng nhập không được để trống', 'error');
            return;
        }
        if (username.length < 3) {
            notify('Tên đăng nhập tối thiểu 3 ký tự', 'error');
            return;
        }
        if (username.length > 50) {
            notify('Tên đăng nhập tối đa 50 ký tự', 'error');
            return;
        }

        // 3. Validate Email: [Required], [EmailAddress]
        if (!email) {
            notify('Email không được để trống', 'error');
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            notify('Địa chỉ email không đúng định dạng', 'error');
            return;
        }

        // 4. Validate PhoneNumber: [RegularExpression(@"^0\d{9}$")] (Nếu có nhập)
        if (phoneNumber) {
            const phoneRegex = /^0\d{9}$/;
            if (!phoneRegex.test(phoneNumber)) {
                notify('Số điện thoại phải có định dạng 10 chữ số (bắt đầu bằng 0)', 'error');
                return;
            }
        }

        // 5. Validate Password: [Required], [MinLength(6)]
        if (!password) {
            notify('Mật khẩu không được để trống', 'error');
            return;
        }
        if (password.length < 6) {
            notify('Mật khẩu phải có độ dài tối thiểu từ 6 ký tự', 'error');
            return;
        }

        // 6. Validate ConfirmPassword: [Required], [Compare("Password")]
        if (!confirmPassword) {
            notify('Xác nhận mật khẩu không được để trống', 'error');
            return;
        }
        if (password !== confirmPassword) {
            notify('Mật khẩu xác nhận không trùng khớp', 'error');
            return;
        }

        // Gửi payload đã qua kiểm tra hợp lệ
        handleRegister({
            fullName,
            username,
            email,
            phoneNumber: phoneNumber || undefined,
            password,
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
                <h2 className={styles.formTitle}>Đăng ký tài khoản</h2>
                <p className={styles.formSubtitle}>Khởi tạo tài khoản độc giả mới</p>

                <form onSubmit={onSubmit} className={styles.form} noValidate>
                    <div className={styles.formGroup}>
                        <label>Họ và tên *</label>
                        <input
                            type="text"
                            name="fullName"
                            placeholder="Nhập họ và tên đầy đủ"
                            value={formData.fullName}
                            onChange={handleChange}
                            maxLength={100}
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
                            maxLength={50}
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
                            maxLength={10}
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
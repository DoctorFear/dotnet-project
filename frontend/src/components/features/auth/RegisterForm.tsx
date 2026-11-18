import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PasswordField } from './PasswordField';
import type { RegisterRequestDto } from '../../../types/user';
import styles from './RegisterForm.module.css';

interface RegisterFormProps {
    onSubmit: (payload: RegisterRequestDto) => void;
    isLoading: boolean;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSubmit, isLoading }) => {
    const [formData, setFormData] = useState<RegisterRequestDto>({
        fullName: '',
        username: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => {
                const updated = { ...prev };
                delete updated[name];
                return updated;
            });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const fullName = formData.fullName.trim();
        const username = formData.username.trim();
        const email = formData.email.trim();
        const phoneNumber = formData.phoneNumber?.trim() || '';
        const password = formData.password;
        const confirmPassword = formData.confirmPassword;

        const newErrors: Record<string, string> = {};

        // 1. Validate FullName
        if (!fullName) {
            newErrors.fullName = 'Họ và tên không được để trống';
        } else if (fullName.length > 100) {
            newErrors.fullName = 'Họ và tên tối đa 100 ký tự';
        }

        // 2. Validate Username
        if (!username) {
            newErrors.username = 'Tên đăng nhập không được để trống';
        } else if (username.length < 3) {
            newErrors.username = 'Tên đăng nhập tối thiểu 3 ký tự';
        } else if (username.length > 50) {
            newErrors.username = 'Tên đăng nhập tối đa 50 ký tự';
        }

        // 3. Validate Email
        if (!email) {
            newErrors.email = 'Email không được để trống';
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                newErrors.email = 'Email không đúng định dạng thư điện tử';
            }
        }

        // 4. Validate PhoneNumber (Nếu có nhập)
        if (phoneNumber) {
            const phoneRegex = /^0\d{9}$/;
            if (!phoneRegex.test(phoneNumber)) {
                newErrors.phoneNumber = 'Số điện thoại phải đúng định dạng 10 chữ số (bắt đầu bằng 0)';
            }
        }

        // 5. Validate Password: tối thiểu 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        if (!password) {
            newErrors.password = 'Mật khẩu không được để trống';
        } else if (!passwordRegex.test(password)) {
            newErrors.password = 'Mật khẩu từ 8 ký tự trở lên, gồm chữ hoa, chữ thường, số và tối thiểu 1 ký tự đặc biệt';
        }

        // 6. Validate ConfirmPassword
        if (!confirmPassword) {
            newErrors.confirmPassword = 'Xác nhận mật khẩu không được để trống';
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});

        onSubmit({
            fullName,
            username,
            email,
            phoneNumber: phoneNumber || undefined,
            password,
            confirmPassword
        });
    };

    return (
        <div className={styles.formColumn}>
            <h2 className={styles.formTitle}>Tạo tài khoản mới</h2>
            <p className={styles.formSubtitle}>Trở thành Thành viên để tận hưởng trọn vẹn đặc quyền</p>

            <form onSubmit={handleSubmit} noValidate>
                <div className={styles.inputGrid}>
                    {/* Hàng 1: Họ và tên + Tên đăng nhập */}
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel} htmlFor="fullName">
                            Họ và tên <span className={styles.req}>*</span>
                        </label>
                        <input
                            type="text"
                            id="fullName"
                            name="fullName"
                            className={`${styles.formInput} ${errors.fullName ? styles.isInvalid : ''}`}
                            placeholder="VD: Nguyễn Văn A"
                            value={formData.fullName}
                            onChange={handleChange}
                            maxLength={100}
                        />
                        <span className={styles.errorText}>{errors.fullName}</span>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel} htmlFor="regUsername">
                            Tên đăng nhập <span className={styles.req}>*</span>
                        </label>
                        <input
                            type="text"
                            id="regUsername"
                            name="username"
                            className={`${styles.formInput} ${errors.username ? styles.isInvalid : ''}`}
                            placeholder="username"
                            value={formData.username}
                            onChange={handleChange}
                            maxLength={50}
                        />
                        <span className={styles.errorText}>{errors.username}</span>
                    </div>

                    {/* Hàng 2: Email + Số điện thoại */}
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel} htmlFor="email">
                            Địa chỉ Email <span className={styles.req}>*</span>
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className={`${styles.formInput} ${errors.email ? styles.isInvalid : ''}`}
                            placeholder="name@domain.com"
                            value={formData.email}
                            onChange={handleChange}
                        />
                        <span className={styles.errorText}>{errors.email}</span>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel} htmlFor="phoneNumber">
                            Số điện thoại
                        </label>
                        <input
                            type="tel"
                            id="phoneNumber"
                            name="phoneNumber"
                            className={`${styles.formInput} ${errors.phoneNumber ? styles.isInvalid : ''}`}
                            placeholder="09xx xxx xxx"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            maxLength={10}
                        />
                        <span className={styles.errorText}>{errors.phoneNumber}</span>
                    </div>

                    {/* Hàng 3: Mật khẩu + Xác nhận mật khẩu */}
                    <PasswordField
                        id="regPassword"
                        name="password"
                        label="Mật khẩu"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Nhập mật khẩu"
                        error={errors.password}
                    />

                    <PasswordField
                        id="confirmPassword"
                        name="confirmPassword"
                        label="Xác nhận mật khẩu"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Nhập lại mật khẩu"
                        error={errors.confirmPassword}
                    />
                </div>

                <button
                    type="submit"
                    className={styles.btnRegister}
                    disabled={isLoading}
                >
                    {isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
                </button>
            </form>

            <div className={styles.formBottomRow}>
                <span>
                    Đã có tài khoản?
                    <Link to="/login" className={styles.formLink}>
                        Đăng nhập ngay
                    </Link>
                </span>
            </div>
        </div>
    );
};

export default RegisterForm;

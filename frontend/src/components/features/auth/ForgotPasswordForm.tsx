import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { ForgotPasswordRequestDto } from '../../../types/user';
import styles from './ForgotPasswordForm.module.css';

interface ForgotPasswordFormProps {
    onSubmit: (payload: ForgotPasswordRequestDto) => Promise<boolean>;
    isLoading: boolean;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onSubmit, isLoading }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [errors, setErrors] = useState<{ username?: string; email?: string }>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const cleanUsername = username.trim();
        const cleanEmail = email.trim().toLowerCase();
        const newErrors: { username?: string; email?: string } = {};

        // 1. Validate Username
        if (!cleanUsername) {
            newErrors.username = 'Tên đăng nhập không được để trống';
        }

        // 2. Validate Email
        if (!cleanEmail) {
            newErrors.email = 'Email không được để trống';
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(cleanEmail)) {
                newErrors.email = 'Địa chỉ email không đúng định dạng';
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});

        const isSent = await onSubmit({
            username: cleanUsername,
            email: cleanEmail
        });

        // Xóa trắng form sau khi gửi thành công
        if (isSent) {
            setUsername('');
            setEmail('');
        }
    };

    return (
        <div className={styles.formColumn}>
            <h2 className={styles.formTitle}>Quên mật khẩu?</h2>
            <p className={styles.formSubtitle}>
                Nhập Tên đăng nhập và Email đã đăng ký để nhận liên kết xác thực đặt lại mật khẩu.
            </p>

            <form onSubmit={handleSubmit} noValidate>
                <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="forgotUsername">
                        Tên đăng nhập
                    </label>
                    <input
                        type="text"
                        id="forgotUsername"
                        className={`${styles.formInput} ${errors.username ? styles.isInvalid : ''}`}
                        placeholder="Nhập tên đăng nhập của bạn"
                        value={username}
                        onChange={(e) => {
                            setUsername(e.target.value);
                            if (errors.username) setErrors(prev => ({ ...prev, username: undefined }));
                        }}
                    />
                    <span className={styles.errorText}>{errors.username}</span>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="forgotEmail">
                        Email đăng ký
                    </label>
                    <input
                        type="email"
                        id="forgotEmail"
                        className={`${styles.formInput} ${errors.email ? styles.isInvalid : ''}`}
                        placeholder="name@domain.com"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                        }}
                    />
                    <span className={styles.errorText}>{errors.email}</span>
                </div>

                <button
                    type="submit"
                    className={styles.btnSubmit}
                    disabled={isLoading}
                >
                    {isLoading ? 'Đang gửi email xác nhận...' : 'Gửi liên kết xác nhận'}
                </button>
            </form>

            <div className={styles.formBottomRow}>
                <Link to="/login" className={styles.backLink}>
                    <ArrowLeft size={16} /> Quay lại đăng nhập
                </Link>
            </div>
        </div>
    );
};

export default ForgotPasswordForm;

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PasswordField } from './PasswordField';
import type { LoginRequestDto } from '../../../types/user';
import styles from './LoginForm.module.css';

interface LoginFormProps {
    onSubmit: (payload: LoginRequestDto) => void;
    isLoading: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, isLoading }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedUsername = username.trim();
        const trimmedPassword = password.trim();
        const newErrors: { username?: string; password?: string } = {};

        // 1. Kiểm tra Username: [Required], tối đa 50 ký tự
        if (!trimmedUsername) {
            newErrors.username = 'Tên đăng nhập không được để trống';
        } else if (trimmedUsername.length > 50) {
            newErrors.username = 'Tên đăng nhập tối đa 50 ký tự.';
        }

        // 2. Kiểm tra Password: [Required]
        if (!password || !trimmedPassword) {
            newErrors.password = 'Mật khẩu không được để trống';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        onSubmit({ username: trimmedUsername, password });
    };

    return (
        <div className={styles.formColumn}>
            <h2 className={styles.formTitle}>Đăng nhập</h2>
            <p className={styles.formSubtitle}>Cổng đăng nhập tập trung cho toàn bộ hệ thống ancientBOOK</p>

            <form onSubmit={handleSubmit} className={styles.form} noValidate>
                <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="loginUsername">
                        Tên đăng nhập
                    </label>
                    <input
                        id="loginUsername"
                        type="text"
                        className={`${styles.formInput} ${errors.username ? styles.isInvalid : ''}`}
                        placeholder="Nhập tên đăng nhập của bạn"
                        value={username}
                        onChange={(e) => {
                            setUsername(e.target.value);
                            if (errors.username) setErrors(prev => ({ ...prev, username: undefined }));
                        }}
                        maxLength={50}
                    />
                    <span className={styles.errorText}>{errors.username}</span>
                </div>

                <PasswordField
                    id="loginPassword"
                    label="Mật khẩu"
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                    }}
                    placeholder="Nhập mật khẩu của bạn"
                    error={errors.password}
                />

                <button 
                    type="submit" 
                    className={styles.btnLogin} 
                    disabled={isLoading}
                >
                    {isLoading ? 'Đang chuyển hướng...' : 'Đăng nhập'}
                </button>
            </form>

            <div className={styles.formBottomRow}>
                <Link to="/forgot-password" className={styles.forgotLink}>
                    Quên mật khẩu?
                </Link>
                <span className={styles.registerHint}>
                    Chưa có tài khoản độc giả?
                    <Link to="/register" className={styles.formLink}>
                        Đăng ký ngay
                    </Link>
                </span>
            </div>
        </div>
    );
};

export default LoginForm;

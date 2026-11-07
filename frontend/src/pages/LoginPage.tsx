import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthAction } from '../hooks/useAuthAction';
import { ToastNotification } from '../components/common/ToastNotification';
import { TopBar } from '../components/layout/TopBar';
import { Header } from '../components/layout/Header';
import styles from './LoginPage.module.css';

export const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
    
    const { isLoading, toasts, dismissToast, notify, handleLogin } = useAuthAction();

    const onSubmit = (e: React.FormEvent) => {
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

        // Gửi thông tin đăng nhập đã hợp lệ
        handleLogin({ 
            username: trimmedUsername, 
            password 
        });
    };

    return (
        <div className={styles.loginPageWrapper}>
            <ToastNotification toasts={toasts} onClose={dismissToast} />

            {/* Sử dụng trực tiếp TopBar và Header layout sẵn có của hệ thống (ẩn thanh tìm kiếm) */}
            <TopBar />
            <Header showSearch={false} />

            {/* Main Wrapper */}
            <main className={styles.mainWrapper}>
                <div className={styles.bookCard}>
                    {/* Left Column: Visual */}
                    <div className={styles.visualColumn}>
                        <div className={styles.visualInner}>
                            <span className={styles.panelKicker}>Chào mừng trở lại</span>
                            <p className={styles.quoteText}>
                                Sách là nguồn tri thức bất tận, mỗi lần mở trang sách là một lần bước vào một chân trời mới.
                            </p>
                            <p className={styles.quoteAuthor}>Hà Thái Sơn</p>
                        </div>
                    </div>

                    {/* Right Column: Form */}
                    <div className={styles.formColumn}>
                        <h2 className={styles.formTitle}>Đăng nhập</h2>
                        <p className={styles.formSubtitle}>Cổng đăng nhập tập trung cho toàn bộ hệ thống ancientBOOK</p>

                        <form onSubmit={onSubmit} className={styles.form} noValidate>
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

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel} htmlFor="loginPassword">
                                    Mật khẩu
                                </label>
                                <div className={styles.passwordInputWrapper}>
                                    <input
                                        id="loginPassword"
                                        type={showPassword ? 'text' : 'password'}
                                        className={`${styles.formInput} ${errors.password ? styles.isInvalid : ''}`}
                                        placeholder="Nhập mật khẩu của bạn"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className={styles.togglePasswordBtn}
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                        aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                <span className={styles.errorText}>{errors.password}</span>
                            </div>

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
                </div>
            </main>
        </div>
    );
};

export default LoginPage;


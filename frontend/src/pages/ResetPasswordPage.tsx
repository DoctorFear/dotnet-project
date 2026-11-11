import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuthAction } from '../hooks/useAuthAction';
import { authService } from '../services/authService';
import { ToastNotification } from '../components/common/ToastNotification';
import { TopBar } from '../components/layout/TopBar';
import { Header } from '../components/layout/Header';
import styles from './ResetPasswordPage.module.css';

export const ResetPasswordPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});

    // Trạng thái kiểm tra token
    const [isVerifyingToken, setIsVerifyingToken] = useState<boolean>(true);
    const [tokenError, setTokenError] = useState<string | null>(null);

    const { isLoading, toasts, dismissToast, notify, handleResetPassword } = useAuthAction();

    useEffect(() => {
        let isMounted = true;

        if (!token) {
            setTokenError('Liên kết khôi phục không hợp lệ hoặc thiếu mã xác thực.');
            setIsVerifyingToken(false);
            notify('Liên kết khôi phục không hợp lệ.', 'error');
            return;
        }

        const checkToken = async () => {
            try {
                const res = await authService.verifyResetToken(token);
                if (!isMounted) return;

                if (!res.success) {
                    setTokenError(res.message || 'Liên kết đặt lại mật khẩu đã hết hạn (quá 15 phút) hoặc không hợp lệ.');
                    notify(res.message || 'Liên kết đã hết hạn hoặc không hợp lệ.', 'error');
                } else {
                    setTokenError(null);
                }
            } catch (err: any) {
                if (!isMounted) return;
                const errorMsg = err.message || 'Liên kết đặt lại mật khẩu đã hết hạn (quá 15 phút) hoặc không hợp lệ.';
                setTokenError(errorMsg);
                notify(errorMsg, 'error');
            } finally {
                if (isMounted) setIsVerifyingToken(false);
            }
        };

        checkToken();

        return () => {
            isMounted = false;
        };
    }, [token]);

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (tokenError || !token) {
            notify('Mã liên kết không hợp lệ hoặc đã hết hạn.', 'error');
            return;
        }

        const newErrors: { newPassword?: string; confirmPassword?: string } = {};

        // 1. Kiểm tra Mật khẩu mới: [Required], tối thiểu 8 ký tự, chữ hoa, thường, số, ký tự đặc biệt
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        if (!newPassword) {
            newErrors.newPassword = 'Mật khẩu mới không được để trống';
        } else if (!passwordRegex.test(newPassword)) {
            newErrors.newPassword = 'Mật khẩu từ 8 ký tự trở lên, gồm chữ hoa, chữ thường, số và tối thiểu 1 ký tự đặc biệt';
        }

        // 2. Kiểm tra Xác nhận mật khẩu: [Required], trùng khớp
        if (!confirmPassword) {
            newErrors.confirmPassword = 'Xác nhận mật khẩu không được để trống';
        } else if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});

        handleResetPassword({
            token,
            newPassword,
            confirmPassword
        });
    };

    return (
        <div className={styles.resetPasswordPageWrapper}>
            <ToastNotification toasts={toasts} onClose={dismissToast} />

            {/* Dùng chung TopBar & Header hệ thống (ẩn ô tìm kiếm) */}
            <TopBar />
            <Header showSearch={false} />

            <main className={styles.mainWrapper}>
                <div className={styles.bookCard}>
                    {/* Left Column */}
                    <div className={styles.visualColumn}>
                        <div className={styles.visualInner}>
                            <span className={styles.panelKicker}>Thiết lập mật mã</span>
                            <p className={styles.quoteText}>
                                Một mật khẩu an toàn sẽ bảo vệ tủ sách và dữ liệu cá nhân của bạn trên mọi hành trình.
                            </p>
                            <p className={styles.quoteAuthor}>Nguyễn Ngọc Vũ Sang</p>
                        </div>
                    </div>

                    {/* Right Column: Form hoặc Cảnh báo hết hạn */}
                    <div className={styles.formColumn}>
                        {isVerifyingToken ? (
                            <div style={{ textAlign: 'center', padding: '60px 0' }}>
                                <RefreshCw className={styles.spinningIcon} size={32} style={{ animation: 'spin 1s linear infinite', color: '#0B409C', marginBottom: '16px' }} />
                                <h3 style={{ fontSize: '18px', color: '#0D226B' }}>Đang xác thực liên kết...</h3>
                                <p style={{ fontSize: '14px', color: '#5b6e99', marginTop: '6px' }}>Vui lòng chờ trong giây lát</p>
                            </div>
                        ) : tokenError ? (
                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                <AlertCircle size={48} color="#dc2626" style={{ marginBottom: '16px' }} />
                                <h2 className={styles.formTitle} style={{ color: '#dc2626', fontSize: '22px' }}>
                                    Liên kết đã hết hạn
                                </h2>
                                <p className={styles.formSubtitle} style={{ marginTop: '10px', color: '#475569' }}>
                                    {tokenError}
                                </p>
                                <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                    <Link 
                                        to="/forgot-password" 
                                        className={styles.btnSubmit} 
                                        style={{ display: 'inline-block', textDecoration: 'none', padding: '10px 24px', textAlign: 'center' }}
                                    >
                                        Gửi lại yêu cầu khôi phục
                                    </Link>
                                </div>
                                <div className={styles.formBottomRow} style={{ marginTop: '20px', justifyContent: 'center' }}>
                                    <Link to="/login" className={styles.backLink}>
                                        <ArrowLeft size={16} /> Quay lại đăng nhập
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h2 className={styles.formTitle}>Đặt lại mật khẩu mới</h2>
                                <p className={styles.formSubtitle}>
                                    Vui lòng nhập mật khẩu mới cho tài khoản của bạn để hoàn tất quá trình khôi phục.
                                </p>

                                <form onSubmit={onSubmit} noValidate>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel} htmlFor="newPassword">
                                            Mật khẩu mới
                                        </label>
                                        <div className={styles.passwordInputWrapper}>
                                            <input
                                                id="newPassword"
                                                type={showNewPassword ? 'text' : 'password'}
                                                className={`${styles.formInput} ${errors.newPassword ? styles.isInvalid : ''}`}
                                                placeholder="Từ 8 ký tự, có hoa, thường, số, ký tự đặc biệt"
                                                value={newPassword}
                                                onChange={(e) => {
                                                    setNewPassword(e.target.value);
                                                    if (errors.newPassword) setErrors(prev => ({ ...prev, newPassword: undefined }));
                                                }}
                                            />
                                            <button
                                                type="button"
                                                className={styles.togglePasswordBtn}
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                tabIndex={-1}
                                                aria-label={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                            >
                                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        <span className={styles.errorText}>{errors.newPassword}</span>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel} htmlFor="confirmNewPassword">
                                            Xác nhận mật khẩu mới
                                        </label>
                                        <div className={styles.passwordInputWrapper}>
                                            <input
                                                id="confirmNewPassword"
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                className={`${styles.formInput} ${errors.confirmPassword ? styles.isInvalid : ''}`}
                                                placeholder="Nhập lại mật khẩu mới"
                                                value={confirmPassword}
                                                onChange={(e) => {
                                                    setConfirmPassword(e.target.value);
                                                    if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                                                }}
                                            />
                                            <button
                                                type="button"
                                                className={styles.togglePasswordBtn}
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                tabIndex={-1}
                                                aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                            >
                                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        <span className={styles.errorText}>{errors.confirmPassword}</span>
                                    </div>

                                    <button
                                        type="submit"
                                        className={styles.btnSubmit}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Đang cập nhật mật khẩu...' : 'Xác nhận đặt lại mật khẩu'}
                                    </button>
                                </form>

                                <div className={styles.formBottomRow}>
                                    <Link to="/login" className={styles.backLink}>
                                        <ArrowLeft size={16} /> Quay lại đăng nhập
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ResetPasswordPage;

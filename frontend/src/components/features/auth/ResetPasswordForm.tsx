import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';
import { PasswordField } from './PasswordField';
import type { ResetPasswordRequestDto } from '../../../types/user';
import styles from './ResetPasswordForm.module.css';

interface ResetPasswordFormProps {
    token: string;
    isVerifyingToken: boolean;
    tokenError: string | null;
    onSubmit: (payload: ResetPasswordRequestDto) => void;
    isLoading: boolean;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
    token,
    isVerifyingToken,
    tokenError,
    onSubmit,
    isLoading
}) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (tokenError || !token) {
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

        onSubmit({
            token,
            newPassword,
            confirmPassword
        });
    };

    return (
        <div className={styles.formColumn}>
            {isVerifyingToken ? (
                <div className={styles.centerState}>
                    <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', color: '#0B409C', marginBottom: '16px' }} />
                    <h3 style={{ fontSize: '18px', color: '#0D226B' }}>Đang xác thực liên kết...</h3>
                    <p style={{ fontSize: '14px', color: '#5b6e99', marginTop: '6px' }}>Vui lòng chờ trong giây lát</p>
                </div>
            ) : tokenError ? (
                <div className={styles.centerState}>
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

                    <form onSubmit={handleSubmit} noValidate>
                        <PasswordField
                            id="newPassword"
                            label="Mật khẩu mới"
                            value={newPassword}
                            onChange={(e) => {
                                setNewPassword(e.target.value);
                                if (errors.newPassword) setErrors(prev => ({ ...prev, newPassword: undefined }));
                            }}
                            placeholder="Từ 8 ký tự, có hoa, thường, số, ký tự đặc biệt"
                            error={errors.newPassword}
                        />

                        <PasswordField
                            id="confirmNewPassword"
                            label="Xác nhận mật khẩu mới"
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                            }}
                            placeholder="Nhập lại mật khẩu mới"
                            error={errors.confirmPassword}
                        />

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
    );
};

export default ResetPasswordForm;

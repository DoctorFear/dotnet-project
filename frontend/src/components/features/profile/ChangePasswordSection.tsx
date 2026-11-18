import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import type { ChangePasswordRequestDto } from '../../../types/user';
import styles from './ChangePasswordSection.module.css';

interface ChangePasswordSectionProps {
    onClose: () => void;
    onSubmit: (payload: ChangePasswordRequestDto) => Promise<boolean>;
    isSaving: boolean;
}

export const ChangePasswordSection: React.FC<ChangePasswordSectionProps> = ({
    onClose,
    onSubmit,
    isSaving
}) => {
    const [passwordForm, setPasswordForm] = useState<ChangePasswordRequestDto>({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};

        if (!passwordForm.currentPassword) {
            newErrors.currentPassword = 'Mật khẩu hiện tại không chính xác';
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        if (!passwordForm.newPassword) {
            newErrors.newPassword = 'Mật khẩu mới không được để trống';
        } else if (!passwordRegex.test(passwordForm.newPassword)) {
            newErrors.newPassword = 'Mật khẩu mới từ 8 ký tự trở lên, gồm chữ hoa, chữ thường, số và tối thiểu 1 ký tự đặc biệt';
        } else if (passwordForm.newPassword === passwordForm.currentPassword) {
            newErrors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại';
        }

        if (!passwordForm.confirmNewPassword || passwordForm.newPassword !== passwordForm.confirmNewPassword) {
            newErrors.confirmNewPassword = 'Mật khẩu xác nhận không trùng khớp';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        const success = await onSubmit(passwordForm);
        if (success) {
            setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
        }
    };

    return (
        <section className={styles.formPanel} id="pwd-form-section">
            <div className={styles.panelHeader}>
                <h2 className={styles.panelTitle}>
                    <Lock size={20} color="var(--catalina, #0D226B)" />
                    Đổi Mật Khẩu
                </h2>
                <button
                    type="button"
                    className={styles.btnClose}
                    onClick={onClose}
                >
                    Đóng
                </button>
            </div>

            <form onSubmit={handleSubmit} noValidate>
                <div className={styles.formGridLayout}>
                    {/* Mật khẩu hiện tại */}
                    <div className={`${styles.formField} ${styles.full}`}>
                        <label className={styles.fieldLabel} htmlFor="inputCurrentPwd">Mật khẩu hiện tại</label>
                        <div className={styles.inputWrapper}>
                            <input
                                type={showCurrentPassword ? 'text' : 'password'}
                                id="inputCurrentPwd"
                                className={`${styles.formControl} ${errors.currentPassword ? styles.errorState : ''}`}
                                placeholder="Nhập mật khẩu hiện tại"
                                value={passwordForm.currentPassword}
                                onChange={(e) => {
                                    setPasswordForm(p => ({ ...p, currentPassword: e.target.value }));
                                    if (errors.currentPassword) setErrors(prev => ({ ...prev, currentPassword: '' }));
                                }}
                            />
                            <button
                                type="button"
                                className={styles.togglePwdBtn}
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                tabIndex={-1}
                            >
                                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {errors.currentPassword && <span className={styles.fieldErrorMsg}>{errors.currentPassword}</span>}
                    </div>

                    {/* Mật khẩu mới */}
                    <div className={styles.formField}>
                        <label className={styles.fieldLabel} htmlFor="inputNewPwd">Mật khẩu mới</label>
                        <div className={styles.inputWrapper}>
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                id="inputNewPwd"
                                className={`${styles.formControl} ${errors.newPassword ? styles.errorState : ''}`}
                                placeholder="Từ 8 ký tự, có hoa, thường, số, ký tự đặc biệt"
                                value={passwordForm.newPassword}
                                onChange={(e) => {
                                    setPasswordForm(p => ({ ...p, newPassword: e.target.value }));
                                    if (errors.newPassword) setErrors(prev => ({ ...prev, newPassword: '' }));
                                }}
                            />
                            <button
                                type="button"
                                className={styles.togglePwdBtn}
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                tabIndex={-1}
                            >
                                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {errors.newPassword && <span className={styles.fieldErrorMsg}>{errors.newPassword}</span>}
                    </div>

                    {/* Xác nhận mật khẩu mới */}
                    <div className={styles.formField}>
                        <label className={styles.fieldLabel} htmlFor="inputConfirmPwd">Xác nhận mật khẩu mới</label>
                        <div className={styles.inputWrapper}>
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                id="inputConfirmPwd"
                                className={`${styles.formControl} ${errors.confirmNewPassword ? styles.errorState : ''}`}
                                placeholder="Nhập lại mật khẩu mới"
                                value={passwordForm.confirmNewPassword}
                                onChange={(e) => {
                                    setPasswordForm(p => ({ ...p, confirmNewPassword: e.target.value }));
                                    if (errors.confirmNewPassword) setErrors(prev => ({ ...prev, confirmNewPassword: '' }));
                                }}
                            />
                            <button
                                type="button"
                                className={styles.togglePwdBtn}
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                tabIndex={-1}
                            >
                                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {errors.confirmNewPassword && <span className={styles.fieldErrorMsg}>{errors.confirmNewPassword}</span>}
                    </div>
                </div>

                <div className={styles.formActions}>
                    <button
                        type="submit"
                        className={styles.btnSubmitAction}
                        disabled={isSaving}
                    >
                        {isSaving ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                    </button>
                </div>
            </form>
        </section>
    );
};

export default ChangePasswordSection;

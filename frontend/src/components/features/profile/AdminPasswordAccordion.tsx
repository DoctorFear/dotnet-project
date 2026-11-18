import React from 'react';
import { ChevronDown } from 'lucide-react';
import { PasswordField } from '../auth/PasswordField';
import styles from './AdminPasswordAccordion.module.css';

interface AdminPasswordAccordionProps {
    isOpen: boolean;
    onToggle: () => void;
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
    errors: {
        currentPassword?: string;
        newPassword?: string;
        confirmNewPassword?: string;
    };
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const AdminPasswordAccordion: React.FC<AdminPasswordAccordionProps> = ({
    isOpen,
    onToggle,
    currentPassword,
    newPassword,
    confirmNewPassword,
    errors,
    onChange
}) => {
    return (
        <div className={styles.passwordSubBox}>
            <div
                className={styles.passwordSubHeader}
                onClick={onToggle}
                role="button"
                tabIndex={0}
            >
                <span>Đổi mật khẩu tài khoản</span>
                <ChevronDown
                    className={`${styles.pwdSubIcon} ${isOpen ? styles.open : ''}`}
                />
            </div>

            <div className={`${styles.passwordSubBody} ${isOpen ? styles.open : ''}`}>
                {/* Mật khẩu hiện tại */}
                <PasswordField
                    id="selfCurrentPwd"
                    name="currentPassword"
                    label="Mật khẩu hiện tại"
                    value={currentPassword}
                    onChange={onChange}
                    placeholder="Nhập mật khẩu hiện tại"
                    error={errors.currentPassword}
                    variant="boxed"
                />

                {/* Mật khẩu mới */}
                <PasswordField
                    id="selfNewPwd"
                    name="newPassword"
                    label="Mật khẩu mới"
                    value={newPassword}
                    onChange={onChange}
                    placeholder="Tối thiểu 6 ký tự"
                    error={errors.newPassword}
                    variant="boxed"
                />

                {/* Xác nhận mật khẩu mới */}
                <PasswordField
                    id="selfConfirmPwd"
                    name="confirmNewPassword"
                    label="Xác nhận mật khẩu mới"
                    value={confirmNewPassword}
                    onChange={onChange}
                    placeholder="Nhập lại mật khẩu mới"
                    error={errors.confirmNewPassword}
                    variant="boxed"
                />
            </div>
        </div>
    );
};

export default AdminPasswordAccordion;

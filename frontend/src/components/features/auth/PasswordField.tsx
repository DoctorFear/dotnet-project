import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import styles from './PasswordField.module.css';

interface PasswordFieldProps {
    id: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    error?: string;
    required?: boolean;
    name?: string;
}

export const PasswordField: React.FC<PasswordFieldProps> = ({
    id,
    label,
    value,
    onChange,
    placeholder = 'Nhập mật khẩu',
    error,
    required = false,
    name
}) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor={id}>
                {label} {required && <span className={styles.req}>*</span>}
            </label>
            <div className={styles.passwordInputWrapper}>
                <input
                    id={id}
                    name={name}
                    type={showPassword ? 'text' : 'password'}
                    className={`${styles.formInput} ${error ? styles.isInvalid : ''}`}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
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
            <span className={styles.errorText}>{error}</span>
        </div>
    );
};

export default PasswordField;

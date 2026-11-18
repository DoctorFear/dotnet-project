import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import styles from './PasswordField.module.css';

export interface PasswordFieldProps {
    id: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    error?: string;
    required?: boolean;
    name?: string;
    variant?: 'underline' | 'boxed';
    containerClassName?: string;
}

export const PasswordField: React.FC<PasswordFieldProps> = ({
    id,
    label,
    value,
    onChange,
    placeholder = 'Nhập mật khẩu',
    error,
    required = false,
    name,
    variant = 'underline',
    containerClassName
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const isBoxed = variant === 'boxed';

    return (
        <div className={`${styles.formGroup} ${containerClassName || ''}`}>
            <label className={styles.formLabel} htmlFor={id}>
                {label} {required && <span className={styles.req}>*</span>}
            </label>
            <div className={styles.passwordInputWrapper}>
                <input
                    id={id}
                    name={name}
                    type={showPassword ? 'text' : 'password'}
                    className={
                        isBoxed
                            ? `${styles.formInputBoxed} ${error ? styles.isInvalid : ''}`
                            : `${styles.formInput} ${error ? styles.isInvalid : ''}`
                    }
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                />
                <button
                    type="button"
                    className={isBoxed ? styles.togglePasswordBtnBoxed : styles.togglePasswordBtn}
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>
            {error && <span className={styles.errorText}>{error}</span>}
        </div>
    );
};

export default PasswordField;

import React from 'react';
import styles from './ProfileInput.module.css';

export interface ProfileInputProps {
    id?: string;
    name?: string;
    label: string;
    type?: string;
    value: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    error?: string;
    required?: boolean;
    readOnly?: boolean;
    maxLength?: number;
}

export const ProfileInput: React.FC<ProfileInputProps> = ({
    id,
    name,
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    error,
    required = false,
    readOnly = false,
    maxLength
}) => {
    return (
        <div className={styles.formGroupModal}>
            <label htmlFor={id}>
                {label} {required && <span className={styles.req}>*</span>}
            </label>
            <input
                id={id}
                name={name}
                type={type}
                className={`${styles.formControlModal} ${error ? styles.isInvalid : ''}`}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                readOnly={readOnly}
                maxLength={maxLength}
            />
            {error && <span className={styles.modalFieldError}>{error}</span>}
        </div>
    );
};

export default ProfileInput;

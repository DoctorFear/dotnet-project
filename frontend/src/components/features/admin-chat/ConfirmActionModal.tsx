import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import styles from './StaffChatConsole.module.css';

interface ConfirmActionModalProps {
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    confirmText: string;
    confirmButtonVariant?: 'primary' | 'danger';
    isSubmitting?: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
    isOpen,
    title,
    message,
    confirmText,
    confirmButtonVariant = 'primary',
    isSubmitting = false,
    onClose,
    onConfirm,
}) => {
    if (!isOpen) return null;

    return (
        <div className={styles.overlay} role="dialog" aria-modal="true">
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <h3>{title}</h3>
                    <button type="button" className={styles.modalClose} onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>
                <div className={styles.modalBody}>
                    <div className={styles.confirmIconWrap}>
                        <AlertTriangle size={24} />
                    </div>
                    <div className={styles.confirmText}>{message}</div>
                </div>
                <div className={styles.modalFooter}>
                    <button
                        type="button"
                        className={styles.btnSecondary}
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Hủy bỏ
                    </button>
                    <button
                        type="button"
                        className={confirmButtonVariant === 'danger' ? styles.btnDanger : styles.btnPrimary}
                        onClick={onConfirm}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Đang xử lý...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

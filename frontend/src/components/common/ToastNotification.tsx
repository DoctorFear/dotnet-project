import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import styles from './ToastNotification.module.css';

export interface ToastMessage {
    id: string;
    message: string;
    type?: 'success' | 'error' | 'info';
}

interface ToastProps {
    toasts: ToastMessage[];
    onClose: (id: string) => void;
}

export const ToastNotification: React.FC<ToastProps> = ({ toasts, onClose }) => {
    return (
        <div className={styles.toastStack}>
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onClose={onClose} />
            ))}
        </div>
    );
};

const ToastItem: React.FC<{ toast: ToastMessage; onClose: (id: string) => void }> = ({ toast, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(toast.id);
        }, 3000);
        return () => clearTimeout(timer);
    }, [toast.id, onClose]);

    const type = toast.type || 'success';

    return (
        <div className={`${styles.toastItem} ${styles[type]}`}>
            {type === 'success' && <CheckCircle2 className={styles.iconSuccess} size={18} />}
            {type === 'error' && <AlertCircle className={styles.iconError} size={18} />}
            {type === 'info' && <Info className={styles.iconInfo} size={18} />}
            <span className={styles.toastText}>{toast.message}</span>
            <button type="button" className={styles.btnClose} onClick={() => onClose(toast.id)} aria-label="Đóng">
                <X size={14} />
            </button>
        </div>
    );
};

export default ToastNotification;
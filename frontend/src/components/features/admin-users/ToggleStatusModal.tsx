import React, { useState } from 'react';
import { Lock, Unlock } from 'lucide-react';
import styles from './AdminUser.module.css';
import type { UserManagementItemDto } from '../../../types/adminUser';

interface ToggleStatusModalProps {
    isOpen: boolean;
    user: UserManagementItemDto | null;
    onClose: () => void;
    onConfirm: (userId: number, newStatus: boolean) => Promise<void>;
}

export const ToggleStatusModal: React.FC<ToggleStatusModalProps> = ({
    isOpen,
    user,
    onClose,
    onConfirm,
}) => {
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    if (!isOpen || !user) return null;

    const isLocking = user.isActive; // Nếu đang active thì hành động là Khóa (newStatus = false)

    const handleConfirm = async () => {
        try {
            setSubmitting(true);
            setErrorMsg(null);
            await onConfirm(user.id, !isLocking);
            onClose();
        } catch (err: unknown) {
            const error = err as { message?: string };
            setErrorMsg(error?.message || 'Có lỗi xảy ra khi cập nhật trạng thái');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div
                className={`${styles.modal} ${styles.modalSm}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.modalBody} style={{ paddingTop: 24 }}>
                    <div
                        className={`${styles.confirmIconWrap} ${
                            isLocking ? styles.danger : styles.success
                        }`}
                    >
                        {isLocking ? (
                            <Lock size={22} />
                        ) : (
                            <Unlock size={22} />
                        )}
                    </div>

                    <p className={styles.confirmText}>
                        {isLocking ? (
                            <>
                                Bạn có chắc chắn muốn khóa tài khoản{' '}
                                <b>{user.fullName}</b> (@{user.username})? Phiên đăng
                                nhập của người dùng sẽ bị thu hồi ngay lập tức.
                            </>
                        ) : (
                            <>
                                Xác nhận mở khóa tài khoản{' '}
                                <b>{user.fullName}</b> (@{user.username})? Người dùng có
                                thể đăng nhập lại vào hệ thống bình thường.
                            </>
                        )}
                    </p>

                    {errorMsg && (
                        <div className={styles.formWarn}>
                            {errorMsg}
                        </div>
                    )}
                </div>

                <div className={styles.modalFooter}>
                    <button
                        type="button"
                        className={styles.btnSecondary}
                        onClick={onClose}
                        disabled={submitting}
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        className={`${styles.btnPrimary} ${
                            isLocking ? styles.btnDanger : ''
                        }`}
                        onClick={handleConfirm}
                        disabled={submitting}
                    >
                        {submitting
                            ? 'Đang xử lý...'
                            : isLocking
                            ? 'Khóa tài khoản'
                            : 'Mở khóa tài khoản'}
                    </button>
                </div>
            </div>
        </div>
    );
};

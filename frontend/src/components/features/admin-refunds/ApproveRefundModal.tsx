import React, { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';
import styles from './AdminRefund.module.css';

interface ApproveRefundModalProps {
    orderId: number | null;
    isSubmitting: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ApproveRefundModal: React.FC<ApproveRefundModalProps> = ({
    orderId,
    isSubmitting,
    onConfirm,
    onCancel,
}) => {
    useEffect(() => {
        if (orderId === null) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isSubmitting) {
                onCancel();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [orderId, isSubmitting, onCancel]);

    if (orderId === null) return null;

    return (
        <div
            className={styles.modalBackdrop}
            role="dialog"
            aria-modal="true"
            aria-labelledby="approve-refund-modal-title"
            onClick={onCancel}
        >
            <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <div className={styles.modalTitleGroup}>
                        <span className={styles.modalIconWrap}>
                            <CheckCircle size={20} />
                        </span>
                        <h3 id="approve-refund-modal-title" className={styles.modalTitle}>
                            Xác nhận duyệt hoàn trả
                        </h3>
                    </div>
                    <button
                        type="button"
                        className={styles.modalCloseBtn}
                        onClick={onCancel}
                        disabled={isSubmitting}
                        aria-label="Đóng"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    <p>
                        Bạn có chắc chắn muốn duyệt yêu cầu hoàn trả cho đơn hàng{' '}
                        <strong>#{orderId}</strong>?
                    </p>
                    <p className={styles.modalSubtext}>
                        Sau khi duyệt, đơn chuyển sang chờ điều phối Shipper thu hồi. Kho và hoàn tiền chỉ được xử lý khi thu hồi thành công.
                    </p>
                </div>

                <div className={styles.modalFooter}>
                    <button
                        type="button"
                        className={styles.btnModalCancel}
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        className={styles.btnModalConfirm}
                        onClick={onConfirm}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Đang xử lý...' : 'Xác nhận duyệt'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApproveRefundModal;
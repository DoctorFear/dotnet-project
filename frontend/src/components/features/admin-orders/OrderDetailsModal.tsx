import React, { useState, useEffect } from 'react';
import { X, Save, ExternalLink, AlertTriangle } from 'lucide-react';
import {
    OrderStatus,
    getAllowedNextStatuses,
    isValidStatusTransition,
    type Order,
} from '../../../types/order';
import styles from '../admin-books/AdminBookManagement.module.css';

interface OrderDetailModalProps {
    order: Order;
    statusLabels: Record<number, string>;
    formatCurrency: (value: number) => string;
    isUpdatingStatus: boolean;
    isManagingPoints: boolean;
    onClose: () => void;
    onChangeOrderStatus: (orderId: number, newStatus: OrderStatus) => Promise<boolean>;
    onApprovePoints: (orderId: number) => Promise<boolean>;
    onRevokePoints: (orderId: number, reason?: string) => Promise<boolean>;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
    order,
    statusLabels,
    formatCurrency,
    isUpdatingStatus,
    isManagingPoints,
    onClose,
    onChangeOrderStatus,
    onApprovePoints,
    onRevokePoints,
}) => {
    const [draftStatus, setDraftStatus] = useState<OrderStatus>(order.status);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [revokeReason, setRevokeReason] = useState('');
    const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);

    useEffect(() => {
        setDraftStatus(order.status);
        setIsConfirmModalOpen(false);
    }, [order]);

    const allowedNextStatuses = getAllowedNextStatuses(order.status);
    const canSaveStatus =
        draftStatus !== order.status && isValidStatusTransition(order.status, draftStatus);

    const handleConfirmStatusUpdate = async () => {
        if (!canSaveStatus) return;
        const success = await onChangeOrderStatus(order.id, draftStatus);
        if (success) {
            setIsConfirmModalOpen(false);
        }
    };

    return (
        <>
            <div className={styles.overlay}>
                <div className={styles.modal}>
                    <div className={styles.modalHeader}>
                        <div>
                            <h3>Chi tiết đơn hàng #{order.id}</h3>
                            <p>Ngày đặt: {new Date(order.orderDate).toLocaleString('vi-VN')}</p>
                        </div>
                        <button
                            type="button"
                            className={styles.modalClose}
                            onClick={onClose}
                            disabled={isUpdatingStatus}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className={styles.modalBody}>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label>Địa chỉ giao hàng</label>
                                <div className={`${styles.formControl} ${styles.readonlyField}`}>
                                    {order.shippingAddress || 'Chưa cập nhật'}
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Tổng thanh toán</label>
                                <div
                                    className={`${styles.formControl} ${styles.readonlyFieldBold}`}
                                >
                                    {formatCurrency(order.finalAmount)}
                                </div>
                            </div>

                            <div className={`${styles.formGroup} ${styles.fullSpan}`}>
                                <label>Cập nhật trạng thái đơn hàng</label>
                                <div className={styles.statusSelectRow}>
                                    <select
                                        className={`${styles.filterSelect} ${styles.statusSelect}`}
                                        value={draftStatus}
                                        disabled={isUpdatingStatus}
                                        onChange={(e) =>
                                            setDraftStatus(Number(e.target.value) as OrderStatus)
                                        }
                                    >
                                        {Object.entries(statusLabels).map(([key, label]) => {
                                            const numericStatus = Number(key) as OrderStatus;
                                            const isCurrent = numericStatus === order.status;
                                            const isAllowed =
                                                allowedNextStatuses.includes(numericStatus);

                                            return (
                                                <option
                                                    key={key}
                                                    value={key}
                                                    disabled={!isCurrent && !isAllowed}
                                                >
                                                    {label}
                                                    {isCurrent ? ' (Hiện tại)' : ''}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <button
                                        type="button"
                                        className={styles.saveStatusBtn}
                                        disabled={!canSaveStatus || isUpdatingStatus}
                                        onClick={() => canSaveStatus && setIsConfirmModalOpen(true)}
                                    >
                                        <Save size={15} />
                                        Lưu
                                    </button>
                                </div>
                            </div>

                            {order.status === OrderStatus.Completed && (
                                <div className={`${styles.formGroup} ${styles.pointsCard}`}>
                                    <label className={styles.pointsHeader}>
                                        <span>Quản lý điểm thưởng F-Point</span>
                                        <span className={styles.pointsBadge}>
                                            {order.rewardPoints ?? 0} điểm{' '}
                                            {order.pointStatus === 'Pending' &&
                                                '(Chờ duyệt - Tự động cộng sau 5 ngày)'}
                                            {order.pointStatus === 'Available' &&
                                                '(Đã cộng vào ví khách)'}
                                            {order.pointStatus === 'Cancelled' &&
                                                '(Đã thu hồi / Hủy)'}
                                        </span>
                                    </label>

                                    <div className={styles.pointsActions}>
                                        {(order.pointStatus === 'Pending' || !order.pointStatus) &&
                                            (order.rewardPoints ?? 0) > 0 && (
                                                <button
                                                    type="button"
                                                    className={styles.btnApprovePoints}
                                                    disabled={isManagingPoints}
                                                    onClick={() => onApprovePoints(order.id)}
                                                >
                                                    {isManagingPoints
                                                        ? 'Đang xử lý...'
                                                        : 'Duyệt cộng điểm ngay'}
                                                </button>
                                            )}

                                        {(order.pointStatus === 'Pending' ||
                                            order.pointStatus === 'Available') && (
                                            <button
                                                type="button"
                                                className={styles.btnRevokePoints}
                                                disabled={isManagingPoints}
                                                onClick={() => {
                                                    setRevokeReason('');
                                                    setIsRevokeModalOpen(true);
                                                }}
                                            >
                                                Thu hồi / Xóa điểm
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {isRevokeModalOpen && (
                                <div className={`${styles.overlay} ${styles.revokeOverlay}`}>
                                    <div
                                        className={`${styles.modal} ${styles.modalCompactRevoke}`}
                                    >
                                        <div className={styles.modalHeader}>
                                            <h3 className={styles.modalTitleNoMargin}>
                                                Thu hồi điểm thưởng đơn #{order.id}
                                            </h3>
                                            <button
                                                type="button"
                                                className={styles.modalClose}
                                                disabled={isManagingPoints}
                                                onClick={() => setIsRevokeModalOpen(false)}
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                        <div className={styles.modalBody}>
                                            <p className={styles.revokeLeadText}>
                                                Hành động này sẽ hủy điểm chờ hoặc trừ trực tiếp{' '}
                                                <strong>{order.rewardPoints ?? 0} F-Point</strong>{' '}
                                                đã tự động cộng khỏi tài khoản khách hàng.
                                            </p>
                                            <div className={styles.formGroup}>
                                                <label>Lý do thu hồi (tùy chọn)</label>
                                                <input
                                                    type="text"
                                                    className={styles.formControl}
                                                    placeholder="VD: Hệ thống cộng sai điểm, đơn hàng có khiếu nại..."
                                                    value={revokeReason}
                                                    onChange={(e) =>
                                                        setRevokeReason(e.target.value)
                                                    }
                                                />
                                            </div>
                                        </div>
                                        <div className={styles.modalFooter}>
                                            <button
                                                type="button"
                                                className={styles.btnSecondary}
                                                disabled={isManagingPoints}
                                                onClick={() => setIsRevokeModalOpen(false)}
                                            >
                                                Hủy
                                            </button>
                                            <button
                                                type="button"
                                                className={styles.btnConfirmDanger}
                                                disabled={isManagingPoints}
                                                onClick={async () => {
                                                    const ok = await onRevokePoints(
                                                        order.id,
                                                        revokeReason
                                                    );
                                                    if (ok) setIsRevokeModalOpen(false);
                                                }}
                                            >
                                                {isManagingPoints
                                                    ? 'Đang thu hồi...'
                                                    : 'Xác nhận thu hồi'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <h4 className={styles.sectionSubtitle}>Sản phẩm đã đặt</h4>
                        <table className={styles.dataTable}>
                            <thead>
                                <tr>
                                    <th>Sách</th>
                                    <th>SL</th>
                                    <th>Đơn giá</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.orderItems.map((item) => {
                                    const bookId = item.book?.id ?? item.bookId;

                                    return (
                                        <tr key={item.id}>
                                            <td>
                                                <div
                                                    className={`${styles.cellTitle} ${styles.bookTitleRow}`}
                                                >
                                                    <strong>
                                                        {item.book?.title || `Sách #${bookId}`}
                                                    </strong>
                                                    <a
                                                        href={`/books/${bookId}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title={`Mở trang sách #${bookId}`}
                                                        className={styles.bookLink}
                                                    >
                                                        <span>Xem sách</span>
                                                        <ExternalLink size={13} />
                                                    </a>
                                                </div>
                                            </td>
                                            <td>{item.quantity}</td>
                                            <td>{formatCurrency(item.unitPrice)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className={styles.modalFooter}>
                        <button
                            type="button"
                            className={styles.btnSecondary}
                            disabled={isUpdatingStatus}
                            onClick={onClose}
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>

            {isConfirmModalOpen && (
                <div
                    className={`${styles.overlay} ${styles.confirmOverlay}`}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="confirm-order-status-title"
                >
                    <div className={`${styles.modal} ${styles.modalCompactConfirm}`}>
                        <div className={styles.modalHeader}>
                            <div className={styles.modalTitleRow}>
                                <AlertTriangle size={18} color="#d97706" />
                                <h3
                                    id="confirm-order-status-title"
                                    className={styles.modalTitleNoMargin}
                                >
                                    Xác nhận cập nhật trạng thái
                                </h3>
                            </div>
                            <button
                                type="button"
                                className={styles.modalClose}
                                disabled={isUpdatingStatus}
                                onClick={() => setIsConfirmModalOpen(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <p className={styles.modalLeadText}>
                                Bạn có chắc chắn muốn cập nhật trạng thái đơn hàng{' '}
                                <strong>#{order.id}</strong>?
                            </p>
                            <div className={styles.statusSummaryBox}>
                                <div>
                                    Trạng thái hiện tại:{' '}
                                    <strong>{statusLabels[order.status]}</strong>
                                </div>
                                <div className={styles.statusSummaryNext}>
                                    Trạng thái mới:{' '}
                                    <strong className={styles.statusNextHighlight}>
                                        {statusLabels[draftStatus]}
                                    </strong>
                                </div>
                            </div>
                            {(draftStatus === OrderStatus.Failed ||
                                draftStatus === OrderStatus.Returned) && (
                                <p className={styles.stockRestoreNote}>
                                    Lưu ý: Chuyển sang trạng thái này sẽ tự động hoàn lại số lượng
                                    sách vào kho.
                                </p>
                            )}
                        </div>
                        <div className={styles.modalFooter}>
                            <button
                                type="button"
                                className={styles.btnSecondary}
                                disabled={isUpdatingStatus}
                                onClick={() => setIsConfirmModalOpen(false)}
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                className={styles.btnConfirmPrimary}
                                disabled={isUpdatingStatus}
                                onClick={handleConfirmStatusUpdate}
                            >
                                {isUpdatingStatus ? 'Đang lưu...' : 'Xác nhận lưu'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
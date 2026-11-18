import React, { useState, useEffect } from 'react';
import { Search, Eye, X, Save, ExternalLink, AlertTriangle } from 'lucide-react';
import { useOrderManagement } from '../../../hooks/useOrderManagement';
import BookPagination from '../../common/BookPagination';
import ToastNotification from '../../common/ToastNotification';
import styles from '../admin-books/AdminBookManagement.module.css';
import { OrderStatus, getAllowedNextStatuses, isValidStatusTransition } from '../../../types/order';

const statusLabels: Record<number, string> = {
    1: 'Chờ xác nhận',
    2: 'Đã xác nhận',
    3: 'Đã chuẩn bị xong',
    4: 'Đang giao',
    5: 'Hoàn thành',
    6: 'Thất bại',
    7: 'Chờ duyệt hoàn trả',
    8: 'Đã duyệt hoàn trả',
    9: 'Hoàn trả thành công',
};

const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')} đ`;

export const AdminOrderManagement: React.FC = () => {
    const {
        orders,
        totalCount,
        isLoading,
        isUpdatingStatus,
        error,
        page,
        pageSize,
        statusFilter,
        searchKeyword,
        selectedOrder,
        isDetailModalOpen,
        toasts,
        setPage,
        setPageSize,
        setStatusFilter,
        setSearchKeyword,
        openOrderDetail,
        closeDetailModal,
        changeOrderStatus,
        removeToast,
        isManagingPoints,
        handleApprovePoints,
        handleRevokePoints
    } = useOrderManagement();

    const [draftStatus, setDraftStatus] = useState<OrderStatus | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [revokeReason, setRevokeReason] = useState('');
    const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);

    useEffect(() => {
        if (selectedOrder) {
            setDraftStatus(selectedOrder.status);
        } else {
            setDraftStatus(null);
            setIsConfirmModalOpen(false);
        }
    }, [selectedOrder]);

    const currentStatus = selectedOrder?.status;
    const effectiveDraftStatus = draftStatus ?? currentStatus;
    const allowedNextStatuses = currentStatus ? getAllowedNextStatuses(currentStatus) : [];
    const canSaveStatus =
        currentStatus !== undefined &&
        effectiveDraftStatus !== undefined &&
        effectiveDraftStatus !== currentStatus &&
        isValidStatusTransition(currentStatus, effectiveDraftStatus);

    const handleOpenConfirmModal = () => {
        if (!canSaveStatus) return;
        setIsConfirmModalOpen(true);
    };

    const handleConfirmStatusUpdate = async () => {
        if (!selectedOrder || !effectiveDraftStatus || !canSaveStatus) return;
        const success = await changeOrderStatus(selectedOrder.id, effectiveDraftStatus);
        if (success) {
            setIsConfirmModalOpen(false);
        }
    };

    return (
        <>
            <ToastNotification toasts={toasts} onClose={removeToast} />

            {/* Toolbar */}
            <section className={styles.tablePanel}>
                <div className={styles.panelHeader}>
                    <div className={styles.toolbar}>
                        <div className={styles.searchWrap}>
                            <Search size={16} />
                            <input
                                type="text"
                                className={styles.searchInput}
                                value={searchKeyword}
                                onChange={(e) => {
                                    setSearchKeyword(e.target.value);
                                    setPage(1);
                                }}
                                placeholder="Tìm mã đơn hàng, SĐT khách..."
                            />
                        </div>
                        <div className={styles.filterGroup}>
                            <select
                                className={styles.filterSelect}
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value as unknown as OrderStatus);
                                    setPage(1);
                                }}
                            >
                                <option value="">Tất cả trạng thái</option>
                                {Object.entries(statusLabels).map(([key, label]) => (
                                    <option key={key} value={key}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {isLoading && <div className={styles.emptyState}>Đang tải dữ liệu đơn hàng...</div>}
                {error && <div className={styles.formWarn}>{error}</div>}

                {/* Table */}
                {!isLoading && !error && (
                    <div className={styles.tableScroll}>
                        <table className={styles.dataTable}>
                            <thead>
                                <tr>
                                    <th>Mã Đơn</th>
                                    <th>Ngày Đặt</th>
                                    <th>Tổng Tiền</th>
                                    <th>Thanh Toán</th>
                                    <th>Trạng Thái</th>
                                    <th>Hành Động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order.id}>
                                        <td>
                                            <strong>#{order.id}</strong>
                                        </td>
                                        <td>{new Date(order.orderDate).toLocaleDateString('vi-VN')}</td>
                                        <td>
                                            <strong>{formatCurrency(order.finalAmount)}</strong>
                                        </td>
                                        <td>
                                            {order.isPaid ? (
                                                <span className={styles.statusSelling}>Đã thanh toán</span>
                                            ) : (
                                                <span className={styles.statusStopped}>Chưa TT</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={styles.statusBadge}>{statusLabels[order.status]}</span>
                                        </td>
                                        <td>
                                            <div className={styles.actionBtns}>
                                                <button
                                                    type="button"
                                                    className={styles.btnTable}
                                                    onClick={() => openOrderDetail(order.id)}
                                                >
                                                    <Eye size={14} /> Chi tiết
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <BookPagination
                    variant="admin"
                    page={page}
                    pageSize={pageSize}
                    totalCount={totalCount}
                    itemLabel="đơn hàng"
                    onPageChange={setPage}
                    onPageSizeChange={(size) => {
                        setPageSize(size);
                        setPage(1);
                    }}
                />
            </section>

            {/* Order Detail Modal */}
            {isDetailModalOpen && selectedOrder && (
                <div className={styles.overlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <div>
                                <h3>Chi tiết đơn hàng #{selectedOrder.id}</h3>
                                <p>Ngày đặt: {new Date(selectedOrder.orderDate).toLocaleString('vi-VN')}</p>
                            </div>
                            <button
                                type="button"
                                className={styles.modalClose}
                                onClick={closeDetailModal}
                                disabled={isUpdatingStatus}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label>Địa chỉ giao hàng</label>
                                    <div className={styles.formControl} style={{ background: '#f9f9f9' }}>
                                        {selectedOrder.shippingAddress || 'Chưa cập nhật'}
                                    </div>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Tổng thanh toán</label>
                                    <div
                                        className={styles.formControl}
                                        style={{ background: '#f9f9f9', fontWeight: 'bold' }}
                                    >
                                        {formatCurrency(selectedOrder.finalAmount)}
                                    </div>
                                </div>
                                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                    <label>Cập nhật trạng thái đơn hàng</label>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <select
                                            className={styles.filterSelect}
                                            style={{ flex: 1 }}
                                            value={effectiveDraftStatus}
                                            disabled={isUpdatingStatus}
                                            onChange={(e) => setDraftStatus(Number(e.target.value) as OrderStatus)}
                                        >
                                            {Object.entries(statusLabels).map(([key, label]) => {
                                                const numericStatus = Number(key) as OrderStatus;
                                                const isCurrent = numericStatus === selectedOrder.status;
                                                const isAllowed = allowedNextStatuses.includes(numericStatus);

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
                                            className={styles.btnPrimary || styles.btnTable}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '8px 16px',
                                                backgroundColor: canSaveStatus ? '#2563eb' : '#9ca3af',
                                                color: '#ffffff',
                                                border: 'none',
                                                borderRadius: '6px',
                                                fontWeight: 600,
                                                cursor: canSaveStatus && !isUpdatingStatus ? 'pointer' : 'not-allowed',
                                            }}
                                            disabled={!canSaveStatus || isUpdatingStatus}
                                            onClick={handleOpenConfirmModal}
                                        >
                                            <Save size={15} />
                                            Lưu
                                        </button>
                                    </div>
                                </div>

                                {selectedOrder.status === OrderStatus.Completed && (
                                <div
                                    className={styles.formGroup}
                                    style={{
                                        gridColumn: '1 / -1',
                                        padding: '12px',
                                        backgroundColor: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                    }}
                                >
                                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>Quản lý điểm thưởng F-Point</span>
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#0b409c' }}>
                                            {selectedOrder.rewardPoints ?? 0} điểm{' '}
                                            {selectedOrder.pointStatus === 'Pending' && '(Chờ duyệt - Tự động cộng sau 5 ngày)'}
                                            {selectedOrder.pointStatus === 'Available' && '(Đã cộng vào ví khách)'}
                                            {selectedOrder.pointStatus === 'Cancelled' && '(Đã thu hồi / Hủy)'}
                                        </span>
                                    </label>

                                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                                        {/* Approve button: shown when points are Pending or not yet granted */}
                                        {(selectedOrder.pointStatus === 'Pending' || !selectedOrder.pointStatus) &&
                                            (selectedOrder.rewardPoints ?? 0) > 0 && (
                                                <button
                                                    type="button"
                                                    disabled={isManagingPoints}
                                                    onClick={() => handleApprovePoints(selectedOrder.id)}
                                                    style={{
                                                        padding: '6px 14px',
                                                        backgroundColor: '#16a34a',
                                                        color: '#fff',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        fontWeight: 600,
                                                        fontSize: '13px',
                                                        cursor: isManagingPoints ? 'not-allowed' : 'pointer',
                                                    }}
                                                >
                                                    {isManagingPoints ? 'Đang xử lý...' : 'Duyệt cộng điểm ngay'}
                                                </button>
                                            )}

                                        {/* Remove/Revoke button: shown when points are Pending or already Auto-Awarded (Available) */}
                                        {(selectedOrder.pointStatus === 'Pending' || selectedOrder.pointStatus === 'Available') && (
                                            <button
                                                type="button"
                                                disabled={isManagingPoints}
                                                onClick={() => {
                                                    setRevokeReason('');
                                                    setIsRevokeModalOpen(true);
                                                }}
                                                style={{
                                                    padding: '6px 14px',
                                                    backgroundColor: '#dc2626',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    fontWeight: 600,
                                                    fontSize: '13px',
                                                    cursor: isManagingPoints ? 'not-allowed' : 'pointer',
                                                }}
                                            >
                                                Thu hồi / Xóa điểm
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Revoke Points Confirmation Modal */}
                            {isRevokeModalOpen && selectedOrder && (
                                <div className={styles.overlay} style={{ zIndex: 1150 }}>
                                    <div className={styles.modal} style={{ maxWidth: '420px' }}>
                                        <div className={styles.modalHeader}>
                                            <h3 style={{ margin: 0 }}>Thu hồi điểm thưởng đơn #{selectedOrder.id}</h3>
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
                                            <p style={{ marginTop: 0, fontSize: '13.5px', lineHeight: 1.5 }}>
                                                Hành động này sẽ hủy điểm chờ hoặc trừ trực tiếp{' '}
                                                <strong>{selectedOrder.rewardPoints ?? 0} F-Point</strong> đã tự động cộng khỏi tài khoản khách hàng.
                                            </p>
                                            <div className={styles.formGroup}>
                                                <label>Lý do thu hồi (tùy chọn)</label>
                                                <input
                                                    type="text"
                                                    className={styles.formControl}
                                                    placeholder="VD: Hệ thống cộng sai điểm, đơn hàng có khiếu nại..."
                                                    value={revokeReason}
                                                    onChange={(e) => setRevokeReason(e.target.value)}
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
                                                disabled={isManagingPoints}
                                                onClick={async () => {
                                                    const ok = await handleRevokePoints(selectedOrder.id, revokeReason);
                                                    if (ok) setIsRevokeModalOpen(false);
                                                }}
                                                style={{
                                                    padding: '8px 16px',
                                                    backgroundColor: '#dc2626',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    fontWeight: 600,
                                                    cursor: isManagingPoints ? 'not-allowed' : 'pointer',
                                                }}
                                            >
                                                {isManagingPoints ? 'Đang thu hồi...' : 'Xác nhận thu hồi'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            </div>

                            <h4 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '14px' }}>
                                Sản phẩm đã đặt
                            </h4>
                            <table className={styles.dataTable}>
                                <thead>
                                    <tr>
                                        <th>Sách</th>
                                        <th>SL</th>
                                        <th>Đơn giá</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedOrder.orderItems.map((item) => {
                                        const bookId = item.book?.id ?? item.bookId;

                                        return (
                                            <tr key={item.id}>
                                                <td>
                                                    <div
                                                        className={styles.cellTitle}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            flexWrap: 'wrap',
                                                        }}
                                                    >
                                                        <strong>{item.book?.title || `Sách #${bookId}`}</strong>
                                                        <a
                                                            href={`/books/${bookId}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            title={`Mở trang sách #${bookId}`}
                                                            style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                fontSize: '12px',
                                                                color: '#2563eb',
                                                                textDecoration: 'none',
                                                                fontWeight: 500,
                                                            }}
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
                                onClick={closeDetailModal}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Update Confirmation Popup Modal */}
            {isConfirmModalOpen && selectedOrder && effectiveDraftStatus && (
                <div
                    className={styles.overlay}
                    style={{ zIndex: 1100 }}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="confirm-order-status-title"
                >
                    <div className={styles.modal} style={{ maxWidth: '440px' }}>
                        <div className={styles.modalHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <AlertTriangle size={18} color="#d97706" />
                                <h3 id="confirm-order-status-title" style={{ margin: 0 }}>
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
                            <p style={{ marginTop: 0, lineHeight: 1.5 }}>
                                Bạn có chắc chắn muốn cập nhật trạng thái đơn hàng{' '}
                                <strong>#{selectedOrder.id}</strong>?
                            </p>
                            <div
                                style={{
                                    padding: '12px',
                                    backgroundColor: '#f9fafb',
                                    borderRadius: '8px',
                                    border: '1px solid #e5e7eb',
                                    fontSize: '13px',
                                }}
                            >
                                <div>
                                    Trạng thái hiện tại:{' '}
                                    <strong>{statusLabels[selectedOrder.status]}</strong>
                                </div>
                                <div style={{ marginTop: '6px' }}>
                                    Trạng thái mới:{' '}
                                    <strong style={{ color: '#2563eb' }}>
                                        {statusLabels[effectiveDraftStatus]}
                                    </strong>
                                </div>
                            </div>
                            {(effectiveDraftStatus === OrderStatus.Failed ||
                                effectiveDraftStatus === OrderStatus.Returned) && (
                                <p
                                    style={{
                                        marginTop: '10px',
                                        marginBottom: 0,
                                        fontSize: '13px',
                                        color: '#b45309',
                                    }}
                                >
                                    Lưu ý: Chuyển sang trạng thái này sẽ tự động hoàn lại số lượng sách vào kho.
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
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#2563eb',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontWeight: 600,
                                    cursor: isUpdatingStatus ? 'not-allowed' : 'pointer',
                                }}
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

export default AdminOrderManagement;
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Search,
    Eye,
    X,
    Save,
    ExternalLink,
    AlertTriangle,
    Truck,
    Package,
    UserCheck,
    XCircle,
    RefreshCw,
} from 'lucide-react';
import { useOrderManagement } from '../../../hooks/useOrderManagement';
import BookPagination from '../../common/BookPagination';
import ToastNotification from '../../common/ToastNotification';
import { OrderStatus } from '../../../types/order';
import { OrderDetailModal } from './OrderDetailsModal';
import styles from '../admin-books/AdminBookManagement.module.css';
import { OrderStatus, getAllowedNextStatuses, isValidStatusTransition } from '../../../types/order';
import {
    warehouseLogisticsApi,
    type PhysicalOrderSummaryDto,
    type OrderTrackingDetailDto,
    type ShipperDto,
} from '../../../services/warehouseLogisticsApi';

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
        handleRevokePoints,
    } = useOrderManagement();

    const [draftStatus, setDraftStatus] = useState<OrderStatus | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [revokeReason, setRevokeReason] = useState('');
    const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);

    // Tab chuyển đổi giữa Quản lý đơn hàng & Điều phối Shipper / Tiến trình vận đơn
    const [activeOrderTab, setActiveOrderTab] = useState<'orders' | 'dispatch'>('orders');
    const [dispatchOrders, setDispatchOrders] = useState<PhysicalOrderSummaryDto[]>([]);
    const [shippers, setShippers] = useState<ShipperDto[]>([]);
    const [dispatchKeyword, setDispatchKeyword] = useState('');
    const [dispatchStatusFilter, setDispatchStatusFilter] = useState('');
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [assignOrderId, setAssignOrderId] = useState<number>(0);
    const [assignShipperId, setAssignShipperId] = useState<number>(0);
    const [trackingModalData, setTrackingModalData] = useState<OrderTrackingDetailDto | null>(null);
    const [dispatchNotice, setDispatchNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const showDispatchNotice = (text: string, type: 'success' | 'error' = 'success') => {
        setDispatchNotice({ text, type });
        window.setTimeout(() => setDispatchNotice(null), 3500);
    };

    const loadDispatchData = async () => {
        try {
            const [orderList, shipperList] = await Promise.all([
                warehouseLogisticsApi.getPhysicalOrders(dispatchStatusFilter, dispatchKeyword),
                warehouseLogisticsApi.getShippers(),
            ]);
            setDispatchOrders(orderList);
            setShippers(shipperList);
            if (shipperList.length > 0 && assignShipperId === 0) {
                const activeShipper = shipperList.find((s) => s.status === 'Active') ?? shipperList[0];
                setAssignShipperId(activeShipper.id);
            }
            if (orderList.length > 0 && assignOrderId === 0) {
                setAssignOrderId(orderList[0].orderId);
            }
        } catch (err) {
            showDispatchNotice(
                err instanceof Error ? err.message : 'Không thể tải dữ liệu điều phối vận đơn',
                'error'
            );
        }
    };

    useEffect(() => {
        if (activeOrderTab === 'dispatch') {
            loadDispatchData();
        }
    }, [activeOrderTab]);

    const handleAssignShipperSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await warehouseLogisticsApi.assignOrderToShipper(
                Number(assignOrderId),
                Number(assignShipperId)
            );
            showDispatchNotice(res.message, 'success');
            setIsAssignModalOpen(false);
            await loadDispatchData();
        } catch (err) {
            showDispatchNotice(err instanceof Error ? err.message : 'Lỗi phân công Shipper', 'error');
        }
    };

    const handleUnassignShipper = async (orderId: number) => {
        try {
            const res = await warehouseLogisticsApi.unassignOrder(orderId);
            showDispatchNotice(res.message, 'success');
            await loadDispatchData();
        } catch (err) {
            showDispatchNotice(err instanceof Error ? err.message : 'Lỗi hủy phân công Shipper', 'error');
        }
    };

    const handleOpenTrackingTimeline = async (orderId: number) => {
        try {
            const detail = await warehouseLogisticsApi.getOrderTracking(orderId);
            setTrackingModalData(detail);
        } catch (err) {
            showDispatchNotice(err instanceof Error ? err.message : 'Lỗi tải tiến trình vận đơn', 'error');
        }
    };

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

            {/* Toolbar & Table */}
            <section className={styles.tablePanel}>
                <div className={styles.panelHeader}>
                    <div className={styles.tabRow}>
                        <button
                            type="button"
                            className={`${styles.tabButton} ${activeOrderTab === 'orders' ? styles.active : ''}`}
                            onClick={() => setActiveOrderTab('orders')}
                        >
                            <Package size={16} /> Danh sách & Trạng thái Đơn hàng
                        </button>
                        <button
                            type="button"
                            className={`${styles.tabButton} ${activeOrderTab === 'dispatch' ? styles.active : ''}`}
                            onClick={() => setActiveOrderTab('dispatch')}
                        >
                            <Truck size={16} /> Điều phối Shipper & Tiến trình Vận đơn
                        </button>
                    </div>

                    {dispatchNotice && (
                        <div
                            style={{
                                padding: '10px 14px',
                                borderRadius: 6,
                                background: dispatchNotice.type === 'success' ? '#dcfce7' : '#fee2e2',
                                color: dispatchNotice.type === 'success' ? '#166534' : '#991b1b',
                                fontWeight: 600,
                                fontSize: 13,
                            }}
                        >
                            {dispatchNotice.text}
                        </div>
                    )}

                    {activeOrderTab === 'orders' ? (
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
                    ) : (
                        <div className={styles.toolbar}>
                            <div className={styles.searchWrap}>
                                <Search size={16} />
                                <input
                                    type="text"
                                    className={styles.searchInput}
                                    value={dispatchKeyword}
                                    onChange={(e) => setDispatchKeyword(e.target.value)}
                                    placeholder="Tìm mã vận đơn ORD-..., tên KH, địa chỉ..."
                                />
                            </div>
                            <div className={styles.filterGroup}>
                                <select
                                    className={styles.filterSelect}
                                    value={dispatchStatusFilter}
                                    onChange={(e) => setDispatchStatusFilter(e.target.value)}
                                >
                                    <option value="">Tất cả trạng thái vận đơn</option>
                                    <option value="Pending">Chờ xác nhận (Pending)</option>
                                    <option value="Confirmed">Đã xác nhận (Confirmed)</option>
                                    <option value="Prepared">Đã chuẩn bị xong (Prepared)</option>
                                    <option value="Shipping">Đang giao hàng (Shipping)</option>
                                    <option value="Completed">Hoàn thành (Completed)</option>
                                    <option value="Failed">Thất bại / Đã hủy (Failed)</option>
                                    <option value="ReturnRequested">Chờ duyệt hoàn trả</option>
                                    <option value="ReturnApproved">Đã duyệt hoàn trả - Chờ thu hồi</option>
                                    <option value="Returned">Đã hoàn trả</option>
                                </select>
                                <button
                                    type="button"
                                    className={styles.btnSecondary}
                                    onClick={loadDispatchData}
                                >
                                    <RefreshCw size={14} /> Lọc vận đơn
                                </button>
                                <button
                                    type="button"
                                    className={styles.btnPrimary}
                                    onClick={() => setIsAssignModalOpen(true)}
                                >
                                    <UserCheck size={15} /> Phân công Vận đơn cho Shipper
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {activeOrderTab === 'orders' && (
                    <>
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
                                                    <span className={styles.statusBadge}>
                                                        {statusLabels[order.status]}
                                                    </span>
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
                    </>
                )}

                {activeOrderTab === 'dispatch' && (
                    <div className={styles.tableScroll}>
                        <table className={styles.dataTable}>
                            <thead>
                                <tr>
                                    <th>Mã Vận Đơn</th>
                                    <th>Khách Hàng & Ngày Đặt</th>
                                    <th>Địa Chỉ Giao / Thu Hồi</th>
                                    <th>Tổng Tiền</th>
                                    <th>Shipper Phụ Trách</th>
                                    <th>Trạng Thái</th>
                                    <th>Điều Phối & Tiến Trình</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dispatchOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className={styles.emptyState}>
                                            Không tìm thấy vận đơn vật lý nào khớp bộ lọc.
                                        </td>
                                    </tr>
                                ) : (
                                    dispatchOrders.map((o) => (
                                        <tr key={o.orderId}>
                                            <td>
                                                <strong>{o.orderCode}</strong>
                                            </td>
                                            <td>
                                                <div className={styles.cellTitle}>
                                                    <strong>{o.customerName}</strong>
                                                    <span>
                                                        {new Date(o.orderDate).toLocaleString('vi-VN')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>{o.shippingAddress || 'Đơn E-Book / Chưa có địa chỉ'}</td>
                                            <td>
                                                <div className={styles.cellTitle}>
                                                    <strong>{formatCurrency(o.finalAmount)}</strong>
                                                    <span>{o.isPaid ? 'Đã thanh toán' : 'Thu hộ COD'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                {o.shipperName ? (
                                                    <span className={styles.chip}>
                                                        <Truck size={12} style={{ verticalAlign: 'middle' }} />{' '}
                                                        {o.shipperName}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: '#64748b', fontSize: 12 }}>
                                                        Chưa phân công
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={styles.statusBadge}>{o.status}</span>
                                            </td>
                                            <td>
                                                <div className={styles.actionBtns}>
                                                    <button
                                                        type="button"
                                                        className={styles.btnTable}
                                                        onClick={() => {
                                                            setAssignOrderId(o.orderId);
                                                            setIsAssignModalOpen(true);
                                                        }}
                                                    >
                                                        <UserCheck size={13} />{' '}
                                                        {o.shipperName ? 'Đổi Shipper' : 'Gán Shipper'}
                                                    </button>
                                                    {o.shipperId && (
                                                        <button
                                                            type="button"
                                                            className={`${styles.btnTable} ${styles.danger}`}
                                                            onClick={() => handleUnassignShipper(o.orderId)}
                                                        >
                                                            <XCircle size={13} /> Hủy gán
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        className={styles.btnTable}
                                                        onClick={() => handleOpenTrackingTimeline(o.orderId)}
                                                    >
                                                        <Eye size={13} /> Tiến trình
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Modal Phân công Shipper */}
            {isAssignModalOpen && (
                <div className={styles.overlay}>
                    <form
                        className={`${styles.modal} ${styles.modalSmall}`}
                        onSubmit={handleAssignShipperSubmit}
                    >
                        <div className={styles.modalHeader}>
                            <div>
                                <h3>Điều phối & Phân công Vận đơn cho Shipper</h3>
                                <p>Hệ thống tự động kiểm tra trạng thái hoạt động và giới hạn đơn nhận đồng thời</p>
                            </div>
                            <button
                                type="button"
                                className={styles.modalClose}
                                onClick={() => setIsAssignModalOpen(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                <label>Chọn Vận đơn cần giao / thu hồi</label>
                                <select
                                    className={styles.filterSelect}
                                    style={{ width: '100%' }}
                                    value={assignOrderId}
                                    onChange={(e) => setAssignOrderId(Number(e.target.value))}
                                >
                                    {dispatchOrders.map((o) => (
                                        <option key={o.orderId} value={o.orderId}>
                                            {o.orderCode} - {o.customerName} ({o.status}) • {o.shippingAddress}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.formGroup} style={{ gridColumn: '1 / -1', marginTop: 12 }}>
                                <label>Chọn Shipper phụ trách</label>
                                <select
                                    className={styles.filterSelect}
                                    style={{ width: '100%' }}
                                    value={assignShipperId}
                                    onChange={(e) => setAssignShipperId(Number(e.target.value))}
                                >
                                    {shippers.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} ({s.area}) — Tải: {s.activeOrdersCount}/
                                            {s.maxConcurrentOrders} đơn [{s.status}]
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button
                                type="button"
                                className={styles.btnSecondary}
                                onClick={() => setIsAssignModalOpen(false)}
                            >
                                Hủy
                            </button>
                            <button type="submit" className={styles.btnPrimary}>
                                Xác nhận Phân công
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Modal Xem Tiến trình Vận đơn vật lý */}
            {trackingModalData && (
                <div className={styles.overlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <div>
                                <h3>
                                    Tiến trình Vận đơn {trackingModalData.orderCode} — Trạng thái:{' '}
                                    {trackingModalData.status}
                                </h3>
                                <p>
                                    Địa chỉ giao: {trackingModalData.shippingAddress} | Shipper:{' '}
                                    {trackingModalData.shipperName
                                        ? `${trackingModalData.shipperName} (${trackingModalData.shipperPhone})`
                                        : 'Chưa phân công'}
                                </p>
                            </div>
                            <button
                                type="button"
                                className={styles.modalClose}
                                onClick={() => setTrackingModalData(null)}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: `repeat(${trackingModalData.timeline.length}, 1fr)`,
                                    gap: 10,
                                    marginBottom: 16,
                                }}
                            >
                                {trackingModalData.timeline.map((step, idx) => (
                                    <div
                                        key={step.stepCode}
                                        style={{
                                            padding: 12,
                                            borderRadius: 8,
                                            border: step.isCurrent
                                                ? '2px solid #0b409c'
                                                : step.isCompleted
                                                  ? '1px solid #86efac'
                                                  : '1px solid #dce6f7',
                                            background: step.isCurrent
                                                ? '#eff6ff'
                                                : step.isCompleted
                                                  ? '#f0fdf4'
                                                  : '#f8faff',
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: 11.5,
                                                fontWeight: 800,
                                                color: step.isCompleted ? '#15803d' : '#5b6e99',
                                            }}
                                        >
                                            Bước {idx + 1} {step.isCompleted ? '✓' : ''}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 13.5,
                                                fontWeight: 800,
                                                color: '#0d226b',
                                                marginTop: 4,
                                            }}
                                        >
                                            {step.title}
                                        </div>
                                        <div style={{ fontSize: 12, color: '#5b6e99', marginTop: 4 }}>
                                            {step.description}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <table className={styles.dataTable}>
                                <thead>
                                    <tr>
                                        <th>Đầu sách</th>
                                        <th>Số lượng</th>
                                        <th>Đơn giá</th>
                                        <th>Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {trackingModalData.items.map((item) => (
                                        <tr key={item.bookId}>
                                            <td style={{ fontWeight: 700 }}>
                                                {item.bookTitle || `Sách #${item.bookId}`}
                                            </td>
                                            <td>x{item.quantity}</td>
                                            <td>{formatCurrency(item.unitPrice)}</td>
                                            <td style={{ fontWeight: 700, color: '#0d226b' }}>
                                                {formatCurrency(item.subTotal)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className={styles.modalFooter}>
                            <Link
                                to={`/order-tracking/${trackingModalData.orderId}`}
                                className={styles.btnPrimary}
                                style={{ textDecoration: 'none' }}
                            >
                                <ExternalLink size={14} /> Mở trên Trang Khách hàng
                            </Link>
                            <button
                                type="button"
                                className={styles.btnSecondary}
                                onClick={() => setTrackingModalData(null)}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

            {/* Order Detail Modal */}
            {isDetailModalOpen && selectedOrder && (
                <OrderDetailModal
                    order={selectedOrder}
                    statusLabels={statusLabels}
                    formatCurrency={formatCurrency}
                    isUpdatingStatus={isUpdatingStatus}
                    isManagingPoints={isManagingPoints}
                    onClose={closeDetailModal}
                    onChangeOrderStatus={changeOrderStatus}
                    onApprovePoints={handleApprovePoints}
                    onRevokePoints={handleRevokePoints}
                />
            )}
        </>
    );
};

export default AdminOrderManagement;
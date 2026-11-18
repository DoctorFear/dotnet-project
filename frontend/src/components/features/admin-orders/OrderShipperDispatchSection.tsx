import React from 'react';
import { Link } from 'react-router-dom';
import { Search, RefreshCw, UserCheck, Truck, XCircle, Eye, X, ExternalLink } from 'lucide-react';
import type {
    PhysicalOrderSummaryDto,
    OrderTrackingDetailDto,
    ShipperDto,
} from '../../../types/shipper';
import styles from '../admin-books/AdminBookManagement.module.css';

const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')} đ`;

interface OrderShipperDispatchProps {
    dispatchOrders: PhysicalOrderSummaryDto[];
    shippers: ShipperDto[];
    dispatchKeyword: string;
    setDispatchKeyword: (v: string) => void;
    dispatchStatusFilter: string;
    setDispatchStatusFilter: (v: string) => void;
    isAssignModalOpen: boolean;
    setIsAssignModalOpen: (v: boolean) => void;
    assignOrderId: number;
    setAssignOrderId: (v: number) => void;
    assignShipperId: number;
    setAssignShipperId: (v: number) => void;
    trackingModalData: OrderTrackingDetailDto | null;
    setTrackingModalData: (v: OrderTrackingDetailDto | null) => void;
    loadDispatchData: () => Promise<void>;
    handleAssignShipperSubmit: (e: React.FormEvent) => Promise<void>;
    handleUnassignShipper: (orderId: number) => Promise<void>;
    handleOpenTrackingTimeline: (orderId: number) => Promise<void>;
}

export const OrderShipperDispatchToolbar: React.FC<
    Pick<
        OrderShipperDispatchProps,
        | 'dispatchKeyword'
        | 'setDispatchKeyword'
        | 'dispatchStatusFilter'
        | 'setDispatchStatusFilter'
        | 'loadDispatchData'
        | 'setIsAssignModalOpen'
    >
> = ({
    dispatchKeyword,
    setDispatchKeyword,
    dispatchStatusFilter,
    setDispatchStatusFilter,
    loadDispatchData,
    setIsAssignModalOpen,
}) => (
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
            <button type="button" className={styles.btnSecondary} onClick={() => void loadDispatchData()}>
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
);

export const OrderShipperDispatchSection: React.FC<OrderShipperDispatchProps> = ({
    dispatchOrders,
    shippers,
    isAssignModalOpen,
    setIsAssignModalOpen,
    assignOrderId,
    setAssignOrderId,
    assignShipperId,
    setAssignShipperId,
    trackingModalData,
    setTrackingModalData,
    handleAssignShipperSubmit,
    handleUnassignShipper,
    handleOpenTrackingTimeline,
}) => {
    return (
        <>
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
                                            <span>{new Date(o.orderDate).toLocaleString('vi-VN')}</span>
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
                                                    onClick={() => void handleUnassignShipper(o.orderId)}
                                                >
                                                    <XCircle size={13} /> Hủy gán
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                className={styles.btnTable}
                                                onClick={() => void handleOpenTrackingTimeline(o.orderId)}
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

            {/* Modal Phân công Shipper */}
            {isAssignModalOpen && (
                <div className={styles.overlay}>
                    <form
                        className={`${styles.modal} ${styles.modalSmall}`}
                        onSubmit={(e) => void handleAssignShipperSubmit(e)}
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
        </>
    );
};

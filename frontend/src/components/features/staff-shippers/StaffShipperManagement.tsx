import React from 'react';
import {
    Truck,
    Search,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Edit3,
    Eye,
    Users,
    Activity,
    MapPin,
    X,
} from 'lucide-react';
import { useStaffShipperManagement } from '../../../hooks/useStaffShipperManagement';
import styles from '../../../pages/WarehouseLogisticsPage.module.css';

export const StaffShipperManagement: React.FC = () => {
    const {
        toast,
        shippers,
        shipperAreaFilter,
        setShipperAreaFilter,
        shipperStatusFilter,
        setShipperStatusFilter,
        isShipperModalOpen,
        setIsShipperModalOpen,
        editingShipperId,
        shipperForm,
        setShipperForm,
        selectedShipperOrders,
        setSelectedShipperOrders,
        loadShippers,
        openEditShipperModal,
        handleSaveShipper,
        handleChangeShipperStatus,
        handleViewShipperOrders,
        handleUnassignOrder,
    } = useStaffShipperManagement();

    const activeCount = shippers.filter((s) => s.status === 'Active').length;
    const busyCount = shippers.filter((s) => s.status === 'Busy').length;
    const totalAssignedOrders = shippers.reduce((sum, s) => sum + s.activeOrdersCount, 0);

    return (
        <>
            {toast && (
                <div
                    className={`${styles.toastBanner} ${
                        toast.type === 'success' ? styles.toastSuccess : styles.toastError
                    }`}
                >
                    {toast.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                    <span>{toast.text}</span>
                </div>
            )}

            <div className={styles.pageStack}>
                {/* 4 KPI Stat Boxes */}
                <div className={styles.statsGrid}>
                    <div className={styles.statBox}>
                        <div className={styles.statInfo}>
                            <span className={styles.statLabel}>Tổng nhân sự Shipper</span>
                            <span className={styles.statValue}>{shippers.length}</span>
                            <span className={styles.statSub}>Đội ngũ giao nhận nội bộ</span>
                        </div>
                        <div className={styles.statIconWrap}>
                            <Users size={20} />
                        </div>
                    </div>

                    <div className={styles.statBox}>
                        <div className={styles.statInfo}>
                            <span className={styles.statLabel}>Đang sẵn sàng (Active)</span>
                            <span className={styles.statValue}>{activeCount}</span>
                            <span className={styles.statSub}>Có thể nhận phân công đơn mới</span>
                        </div>
                        <div className={`${styles.statIconWrap} ${styles.success}`}>
                            <Activity size={20} />
                        </div>
                    </div>

                    <div className={styles.statBox}>
                        <div className={styles.statInfo}>
                            <span className={styles.statLabel}>Đang bận / Nghỉ ca</span>
                            <span className={styles.statValue}>
                                {busyCount} bận • {shippers.length - activeCount - busyCount} nghỉ
                            </span>
                            <span className={styles.statSub}>Trạng thái vận hành thực tế</span>
                        </div>
                        <div className={`${styles.statIconWrap} ${styles.warning}`}>
                            <MapPin size={20} />
                        </div>
                    </div>

                    <div className={styles.statBox}>
                        <div className={styles.statInfo}>
                            <span className={styles.statLabel}>Đơn đang phụ trách</span>
                            <span className={styles.statValue}>{totalAssignedOrders} đơn</span>
                            <span className={styles.statSub}>Tổng số đơn đang giao / chờ lấy</span>
                        </div>
                        <div className={styles.statIconWrap}>
                            <Truck size={20} />
                        </div>
                    </div>
                </div>

                {/* Bảng danh sách Shipper */}
                <section className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <div className={styles.toolbar}>
                            <div className={styles.toolbarLeft}>
                                <div className={styles.searchWrap}>
                                    <Search size={16} />
                                    <input
                                        className={styles.searchInput}
                                        placeholder="Tìm theo khu vực phụ trách (Quận 1, Thủ Đức...)"
                                        value={shipperAreaFilter}
                                        onChange={(e) => setShipperAreaFilter(e.target.value)}
                                    />
                                </div>
                                <select
                                    className={styles.filterSelect}
                                    value={shipperStatusFilter}
                                    onChange={(e) => setShipperStatusFilter(e.target.value)}
                                >
                                    <option value="">Mọi trạng thái hoạt động</option>
                                    <option value="Active">Đang sẵn sàng (Active)</option>
                                    <option value="Busy">Đang bận giao (Busy)</option>
                                    <option value="Off">Nghỉ ca (Off)</option>
                                </select>
                                <button
                                    type="button"
                                    className={styles.btnSecondary}
                                    onClick={() => void loadShippers()}
                                >
                                    <RefreshCw size={14} /> Lọc danh sách
                                </button>
                            </div>
                        </div>
                    </div>

                    <table className={styles.dataTable}>
                        <thead>
                            <tr>
                                <th>Mã Shipper</th>
                                <th>Họ và tên Shipper</th>
                                <th>Số điện thoại</th>
                                <th>Khu vực hoạt động</th>
                                <th>Tải đơn hiện tại</th>
                                <th>Trạng thái ca</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shippers.map((s) => {
                                const ratio = Math.min(
                                    100,
                                    Math.round((s.activeOrdersCount / Math.max(1, s.maxConcurrentOrders)) * 100)
                                );
                                const isFull = s.activeOrdersCount >= s.maxConcurrentOrders;
                                return (
                                    <tr key={s.id}>
                                        <td>
                                            <span className={styles.codeChip}>SHP-{s.id}</span>
                                        </td>
                                        <td style={{ fontWeight: 700 }}>{s.name}</td>
                                        <td>{s.phone}</td>
                                        <td>{s.area}</td>
                                        <td>
                                            <div className={styles.workloadWrap}>
                                                <div className={styles.workloadText}>
                                                    <span>
                                                        {s.activeOrdersCount} / {s.maxConcurrentOrders} đơn
                                                    </span>
                                                    <span style={{ color: isFull ? '#dc2626' : '#15803d' }}>
                                                        {isFull ? 'Đầy tải' : 'Còn nhận đơn'}
                                                    </span>
                                                </div>
                                                <div className={styles.workloadBar}>
                                                    <div
                                                        className={`${styles.workloadFill} ${
                                                            isFull ? styles.full : ''
                                                        }`}
                                                        style={{ width: `${ratio}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <select
                                                className={styles.filterSelect}
                                                value={s.status}
                                                onChange={(e) =>
                                                    void handleChangeShipperStatus(s.id, e.target.value)
                                                }
                                            >
                                                <option value="Active">Active (Sẵn sàng)</option>
                                                <option value="Busy">Busy (Đang bận)</option>
                                                <option value="Off">Off (Nghỉ ca)</option>
                                            </select>
                                        </td>
                                        <td>
                                            <div className={styles.actionBtns}>
                                                <button
                                                    type="button"
                                                    className={styles.btnTable}
                                                    onClick={() => void handleViewShipperOrders(s)}
                                                >
                                                    <Eye size={13} /> Xem đơn ({s.activeOrdersCount})
                                                </button>
                                                <button
                                                    type="button"
                                                    className={styles.btnTable}
                                                    onClick={() => openEditShipperModal(s)}
                                                >
                                                    <Edit3 size={13} /> Sửa thông tin
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </section>
            </div>

            {/* Modal Xem Danh sách Vận đơn của Shipper */}
            {selectedShipperOrders && (
                <div className={styles.overlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <div>
                                <h3>
                                    Danh sách Vận đơn của Shipper: {selectedShipperOrders.shipper.name} (
                                    {selectedShipperOrders.orders.length} đơn)
                                </h3>
                                <p>
                                    SĐT: {selectedShipperOrders.shipper.phone} • Khu vực:{' '}
                                    {selectedShipperOrders.shipper.area} • Tải hiện tại:{' '}
                                    {selectedShipperOrders.shipper.activeOrdersCount}/
                                    {selectedShipperOrders.shipper.maxConcurrentOrders} đơn
                                </p>
                            </div>
                            <button
                                type="button"
                                className={styles.modalClose}
                                onClick={() => setSelectedShipperOrders(null)}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <table className={styles.dataTable}>
                                <thead>
                                    <tr>
                                        <th>Mã vận đơn</th>
                                        <th>Khách hàng</th>
                                        <th>Địa chỉ giao / thu hồi</th>
                                        <th>Tổng tiền</th>
                                        <th>Trạng thái đơn</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedShipperOrders.orders.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className={styles.emptyState}>
                                                Shipper này hiện chưa có vận đơn nào được phân công.
                                            </td>
                                        </tr>
                                    ) : (
                                        selectedShipperOrders.orders.map((o) => (
                                            <tr key={o.orderId}>
                                                <td>
                                                    <span className={styles.codeChip}>{o.orderCode}</span>
                                                </td>
                                                <td style={{ fontWeight: 700 }}>{o.customerName}</td>
                                                <td>{o.shippingAddress || 'Chưa cập nhật địa chỉ'}</td>
                                                <td style={{ fontWeight: 700 }}>
                                                    {o.finalAmount.toLocaleString('vi-VN')} đ
                                                </td>
                                                <td>
                                                    <span
                                                        className={`${styles.statusBadge} ${styles.badgeInfo}`}
                                                    >
                                                        {o.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className={`${styles.btnTable} ${styles.danger}`}
                                                        onClick={() => void handleUnassignOrder(o.orderId)}
                                                    >
                                                        <XCircle size={13} /> Thu hồi / Hủy gán
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className={styles.modalFooter}>
                            <button
                                type="button"
                                className={styles.btnSecondary}
                                onClick={() => setSelectedShipperOrders(null)}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Thêm / Sửa Shipper */}
            {isShipperModalOpen && (
                <div className={styles.overlay}>
                    <form
                        className={`${styles.modal} ${styles.modalSmall}`}
                        onSubmit={(e) => void handleSaveShipper(e)}
                    >
                        <div className={styles.modalHeader}>
                            <div>
                                <h3>
                                    {editingShipperId
                                        ? `Cập nhật thông tin Shipper #${editingShipperId}`
                                        : 'Thêm Shipper mới'}
                                </h3>
                                <p>Thiết lập khu vực phụ trách giao hàng và giới hạn số đơn nhận đồng thời</p>
                            </div>
                            <button
                                type="button"
                                className={styles.modalClose}
                                onClick={() => setIsShipperModalOpen(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Họ và tên Shipper *</label>
                                    <input
                                        className={styles.formControl}
                                        required
                                        value={shipperForm.name}
                                        onChange={(e) =>
                                            setShipperForm({ ...shipperForm, name: e.target.value })
                                        }
                                        placeholder="VD: Ngô Bá Duy"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Số điện thoại *</label>
                                    <input
                                        className={styles.formControl}
                                        required
                                        value={shipperForm.phone}
                                        onChange={(e) =>
                                            setShipperForm({ ...shipperForm, phone: e.target.value })
                                        }
                                        placeholder="VD: 0903000001"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Trạng thái ca làm việc</label>
                                    <select
                                        className={styles.formControl}
                                        value={shipperForm.status}
                                        onChange={(e) =>
                                            setShipperForm({ ...shipperForm, status: e.target.value })
                                        }
                                    >
                                        <option value="Active">Active (Sẵn sàng)</option>
                                        <option value="Busy">Busy (Đang bận)</option>
                                        <option value="Off">Off (Nghỉ ca)</option>
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Giới hạn đơn nhận cùng lúc</label>
                                    <input
                                        type="number"
                                        min={1}
                                        className={styles.formControl}
                                        value={shipperForm.maxConcurrentOrders}
                                        onChange={(e) =>
                                            setShipperForm({
                                                ...shipperForm,
                                                maxConcurrentOrders: Number(e.target.value),
                                            })
                                        }
                                    />
                                </div>
                                <div className={styles.formGroupFull}>
                                    <label className={styles.formLabel}>Khu vực phụ trách</label>
                                    <input
                                        className={styles.formControl}
                                        value={shipperForm.area}
                                        onChange={(e) =>
                                            setShipperForm({ ...shipperForm, area: e.target.value })
                                        }
                                        placeholder="VD: Quận 1, Quận 3, TP.HCM"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button
                                type="button"
                                className={styles.btnSecondary}
                                onClick={() => setIsShipperModalOpen(false)}
                            >
                                Hủy
                            </button>
                            <button type="submit" className={styles.btnPrimary}>
                                Lưu thông tin Shipper
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
};

export default StaffShipperManagement;

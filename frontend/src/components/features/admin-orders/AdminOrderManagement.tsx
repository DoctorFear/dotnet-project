import React, { useState } from 'react';
import { Search, Eye, Truck, Package } from 'lucide-react';
import { useOrderManagement } from '../../../hooks/useOrderManagement';
import { useOrderDispatch } from '../../../hooks/useOrderDispatch';
import BookPagination from '../../common/BookPagination';
import ToastNotification from '../../common/ToastNotification';
import { OrderStatus } from '../../../types/order';
import { OrderDetailModal } from './OrderDetailsModal';
import {
    OrderShipperDispatchSection,
    OrderShipperDispatchToolbar,
} from './OrderShipperDispatchSection';
import styles from '../admin-books/AdminBookManagement.module.css';

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

    const [activeOrderTab, setActiveOrderTab] = useState<'orders' | 'dispatch'>('orders');
    const dispatchController = useOrderDispatch(activeOrderTab === 'dispatch');
    const { dispatchNotice } = dispatchController;

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
                        <OrderShipperDispatchToolbar {...dispatchController} />
                    )}
                </div>

                {activeOrderTab === 'orders' && (
                    <>
                        {isLoading && <div className={styles.emptyState}>Đang tải dữ liệu đơn hàng...</div>}
                        {error && <div className={styles.formWarn}>{error}</div>}

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
                                                <td>
                                                    {new Date(order.orderDate).toLocaleDateString('vi-VN')}
                                                </td>
                                                <td>
                                                    <strong>{formatCurrency(order.finalAmount)}</strong>
                                                </td>
                                                <td>
                                                    {order.isPaid ? (
                                                        <span className={styles.statusSelling}>
                                                            Đã thanh toán
                                                        </span>
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

                {activeOrderTab === 'dispatch' && <OrderShipperDispatchSection {...dispatchController} />}
            </section>

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

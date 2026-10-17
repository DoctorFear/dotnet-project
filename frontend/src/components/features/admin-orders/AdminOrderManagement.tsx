import React from 'react';
import { Search, Eye, X, CheckCircle, Truck, Package } from 'lucide-react';
import { useOrderManagement } from '../../../hooks/useOrderManagement';
import BookPagination from '../../common/BookPagination';
import ToastNotification from '../../common/ToastNotification';
import styles from '../admin-books/AdminBookManagement.module.css';
import { OrderStatus } from '../../../types/order';

const statusLabels: Record<number, string> = {
    1: 'Chờ xác nhận', 2: 'Đã xác nhận', 3: 'Đã chuẩn bị xong',
    4: 'Đang giao', 5: 'Hoàn thành', 6: 'Thất bại',
    7: 'Chờ duyệt hoàn trả', 8: 'Đã duyệt hoàn trả', 9: 'Hoàn trả thành công'
};

const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')} đ`;

export const AdminOrderManagement: React.FC = () => {
    const {
        orders, totalCount, isLoading, error, page, pageSize, statusFilter, searchKeyword,
        selectedOrder, isDetailModalOpen, toasts,
        setPage, setPageSize, setStatusFilter, setSearchKeyword,
        openOrderDetail, closeDetailModal, changeOrderStatus, approveRefund, removeToast
    } = useOrderManagement();

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
                                onChange={(e) => { setSearchKeyword(e.target.value); setPage(1); }}
                                placeholder="Tìm mã đơn hàng, SĐT khách..."
                            />
                        </div>
                        <div className={styles.filterGroup}>
                            <select 
                                className={styles.filterSelect} 
                                value={statusFilter} 
                                onChange={(e) => { setStatusFilter(e.target.value as unknown as OrderStatus); setPage(1); }}
                            >
                                <option value="">Tất cả trạng thái</option>
                                {Object.entries(statusLabels).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
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
                                        <td><strong>#{order.id}</strong></td>
                                        <td>{new Date(order.orderDate).toLocaleDateString('vi-VN')}</td>
                                        <td><strong>{formatCurrency(order.finalAmount)}</strong></td>
                                        <td>{order.isPaid ? <span className={styles.statusSelling}>Đã thanh toán</span> : <span className={styles.statusStopped}>Chưa TT</span>}</td>
                                        <td><span className={styles.statusBadge}>{statusLabels[order.status]}</span></td>
                                        <td>
                                            <div className={styles.actionBtns}>
                                                <button type="button" className={styles.btnTable} onClick={() => openOrderDetail(order.id)}>
                                                    <Eye size={14} /> Chi tiết
                                                </button>
                                                {order.status === OrderStatus.ReturnRequested && (
                                                    <button type="button" className={`${styles.btnTable} ${styles.danger}`} onClick={() => approveRefund(order.id)}>
                                                        <CheckCircle size={14} /> Duyệt hoàn
                                                    </button>
                                                )}
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
                    onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
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
                            <button type="button" className={styles.modalClose} onClick={closeDetailModal}><X size={18} /></button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label>Địa chỉ giao hàng</label>
                                    <div className={styles.formControl} style={{background: '#f9f9f9'}}>{selectedOrder.shippingAddress || 'Chưa cập nhật'}</div>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Tổng thanh toán</label>
                                    <div className={styles.formControl} style={{background: '#f9f9f9', fontWeight: 'bold'}}>{formatCurrency(selectedOrder.finalAmount)}</div>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Trạng thái hiện tại</label>
                                    <select 
                                        className={styles.filterSelect}
                                        value={selectedOrder.status}
                                        onChange={(e) => changeOrderStatus(selectedOrder.id, Number(e.target.value) as OrderStatus)}
                                    >
                                        {Object.entries(statusLabels).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <h4 style={{marginTop: '20px', marginBottom: '10px', fontSize: '14px'}}>Sản phẩm đã đặt</h4>
                            <table className={styles.dataTable}>
                                <thead>
                                    <tr>
                                        <th>Sách</th>
                                        <th>SL</th>
                                        <th>Đơn giá</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedOrder.orderItems.map((item) => (
                                        <tr key={item.id}>
                                            <td>
                                                <div className={styles.cellTitle}>
                                                    <strong>{item.book?.title}</strong>
                                                </div>
                                            </td>
                                            <td>{item.quantity}</td>
                                            <td>{formatCurrency(item.unitPrice)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className={styles.modalFooter}>
                            {selectedOrder.status === OrderStatus.ReturnRequested && (
                                <button type="button" className={styles.btnDanger} onClick={() => approveRefund(selectedOrder.id)}>
                                    Duyệt yêu cầu hoàn trả
                                </button>
                            )}
                            <button type="button" className={styles.btnSecondary} onClick={closeDetailModal}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminOrderManagement;
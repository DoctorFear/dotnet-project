import React from 'react';
import { Search, Eye, CheckCircle } from 'lucide-react';
import { useRefundManagement } from '../../../hooks/useRefundManagement';
import { ToastNotification } from '../../common/ToastNotification';
import BookPagination from '../../common/BookPagination'; 
import AdminRefundDetail from './AdminRefundDetail';
import styles from './AdminRefund.module.css'; 

export const AdminRefundManagement: React.FC = () => {
    const {
        refunds, totalCount, isLoading, error, page, pageSize, searchKeyword,
        selectedOrderId, selectedRefundDetail, toasts,
        setPage, setPageSize, setSearchKeyword,
        viewRefundDetail, backToList, approveRefund, removeToast
    } = useRefundManagement();

    // Render detail view if a refund is selected
    if (selectedOrderId && selectedRefundDetail) {
        return (
            <>
                <ToastNotification toasts={toasts} onClose={removeToast} />
                <AdminRefundDetail 
                    detail={selectedRefundDetail} 
                    onBack={backToList} 
                    onApprove={approveRefund} 
                />
            </>
        );
    }

    // Render List View
    return (
        <section className={styles.wrapper}>
            <ToastNotification toasts={toasts} onClose={removeToast} />

            {/* Toolbar */}
            <div className={styles.toolbar}>
                <div className={styles.searchContainer}>
                    <div className={styles.searchIcon}>
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        className={styles.searchInput}
                        value={searchKeyword}
                        onChange={(e) => { setSearchKeyword(e.target.value); setPage(1); }}
                        placeholder="Tìm kiếm mã đơn hàng..."
                    />
                </div>
            </div>

            {/* Content Area */}
            <div className={styles.contentArea}>
                {isLoading && <div className={styles.loadingState}>Đang tải dữ liệu hoàn trả...</div>}
                {error && <div className={styles.errorState}>{error}</div>}

                {!isLoading && !error && refunds.length === 0 && (
                    <div className={styles.emptyState}>Không tìm thấy yêu cầu hoàn trả nào.</div>
                )}

                {!isLoading && !error && refunds.length > 0 && (
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead className={styles.tableHead}>
                                <tr>
                                    <th>Mã Đơn</th>
                                    <th>Ngày Yêu Cầu</th>
                                    <th>Lý Do</th>
                                    <th style={{textAlign: 'center'}}>Hành Động</th>
                                </tr>
                            </thead>
                            <tbody className={styles.tableBody}>
                                {refunds.map((refund) => (
                                    <tr key={refund.id} className={styles.tableRow}>
                                        <td className={styles.tableCellBold}>#{refund.orderId}</td>
                                        <td className={styles.tableCellDate}>
                                            {new Date(refund.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute:'2-digit' })}
                                        </td>
                                        <td className={styles.tableCellTruncate} title={refund.reason}>
                                            {refund.reason}
                                        </td>
                                        <td className={styles.tableCell}>
                                            <div className={styles.actionGroup}>
                                                <button 
                                                    onClick={() => viewRefundDetail(refund.orderId)}
                                                    className={styles.btnDetail}
                                                >
                                                    <Eye size={16} style={{marginRight: '4px'}} /> Chi tiết
                                                </button>
                                                <button 
                                                    onClick={() => approveRefund(refund.orderId)}
                                                    className={styles.btnApproveSm}
                                                >
                                                    <CheckCircle size={16} style={{marginRight: '4px'}} /> Duyệt
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {!isLoading && !error && totalCount > 0 && (
                <div className={styles.paginationArea}>
                    <BookPagination
                        variant="admin"
                        page={page}
                        pageSize={pageSize}
                        totalCount={totalCount}
                        itemLabel="yêu cầu"
                        onPageChange={setPage}
                        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
                    />
                </div>
            )}
        </section>
    );
};

export default AdminRefundManagement;
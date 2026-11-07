import { useState } from 'react';
import {
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    ClipboardCheck,
    Clock3,
    MapPin,
    Package,
    Phone,
    RefreshCw,
    Search,
    Truck,
    X,
} from 'lucide-react';
import AdminLayout from '../components/layout/admin/AdminLayout';
import BookPagination from '../components/common/BookPagination';
import BookCover from '../components/common/BookCover';
import ToastNotification from '../components/common/ToastNotification';
import {
    dateTime,
    EmptyState,
    money,
    WorkflowError,
    WorkflowModal,
} from '../components/features/workflow/WorkflowShared';
import { useFulfillment } from '../hooks/useFulfillment';
import styles from './FulfillmentPage.module.css';
import common from '../components/features/workflow/Workflow.module.css';

export default function FulfillmentPage() {
    const packing = useFulfillment();
    const [issue, setIssue] = useState(false);
    const [reason, setReason] = useState('');
    const [checked, setChecked] = useState(false);
    return (
        <AdminLayout
            activePage="packing"
            title="Tiếp nhận & đóng gói"
            subtitle="Soạn đủ sách, đóng gói và chuyển đơn sang chờ phân công giao hàng"
            badge="Vận hành kho"
        >
            <ToastNotification
                toasts={packing.notifications.toasts}
                onClose={packing.notifications.dismissToast}
            />
            <div className={styles.summary}>
                <div>
                    <span className={styles.summaryIcon}>
                        <Package size={25} />
                    </span>
                    <section>
                        <span>ĐƠN CHỜ ĐÓNG GÓI</span>
                        <strong>{packing.orders.data?.totalCount ?? '—'}</strong>
                        <small>Đơn sách giấy đã được xác nhận</small>
                    </section>
                </div>
                <div className={styles.process}>
                    <span>
                        <CheckCircle2 size={16} /> Đã xác nhận
                    </span>
                    <ArrowRight size={14} />
                    <strong>
                        <Package size={16} /> Đóng gói
                    </strong>
                    <ArrowRight size={14} />
                    <span>
                        <Truck size={16} /> Chờ phân công
                    </span>
                </div>
            </div>
            <section className={common.panel}>
                <div className={common.panelHeader}>
                    <div>
                        <h2>Đơn hàng cần đóng gói</h2>
                        <p className={common.muted}>Kiểm tra sách và số lượng trước khi xác nhận hoàn tất.</p>
                    </div>
                    <button type="button" className={common.secondary} onClick={packing.orders.reload}>
                        <RefreshCw size={14} /> Làm mới
                    </button>
                </div>
                <form
                    className={styles.filters}
                    onSubmit={(event) => {
                        event.preventDefault();
                        const data = new FormData(event.currentTarget);
                        packing.setQuery({
                            ...packing.query,
                            pageNumber: 1,
                            keyword: String(data.get('keyword') ?? '').trim(),
                            fromDate: String(data.get('from') ?? ''),
                            toDate: data.get('to') ? `${data.get('to')}T23:59:59.999` : '',
                        });
                    }}
                >
                    <label className={styles.search}>
                        <Search size={17} />
                        <input
                            name="keyword"
                            placeholder="Tìm mã đơn hoặc tên khách hàng..."
                            aria-label="Tìm mã đơn hoặc tên khách hàng"
                        />
                    </label>
                    <label className={styles.date}>
                        Từ ngày
                        <input name="from" type="date" aria-label="Từ ngày" />
                    </label>
                    <label className={styles.date}>
                        Đến ngày
                        <input name="to" type="date" aria-label="Đến ngày" />
                    </label>
                    <button type="submit" className={common.primary}>
                        Lọc đơn hàng
                    </button>
                </form>
                {packing.error && !packing.selected && (
                    <div className={common.panelBody}>
                        <WorkflowError message={packing.error} />
                    </div>
                )}
                {packing.orders.error ? (
                    <div className={common.panelBody}>
                        <WorkflowError message={packing.orders.error} retry={packing.orders.reload} />
                    </div>
                ) : packing.orders.loading ? (
                    <p role="status" className={common.loading}>
                        Đang tải danh sách đơn...
                    </p>
                ) : packing.orders.data?.items.length === 0 ? (
                    <EmptyState
                        title="Không có đơn cần đóng gói"
                        detail="Đổi bộ lọc hoặc làm mới để kiểm tra đơn vừa xác nhận."
                    />
                ) : (
                    <div className={common.tableScroll}>
                        <table className={common.table}>
                            <thead>
                                <tr>
                                    <th>Mã đơn / Thời gian</th>
                                    <th>Khách hàng</th>
                                    <th>Số lượng</th>
                                    <th>Thanh toán</th>
                                    <th>Trạng thái kho</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {packing.orders.data?.items.map((order) => (
                                    <tr key={order.orderId}>
                                        <td>
                                            <strong className={styles.orderCode}>ORD-{order.orderId}</strong>
                                            <small>{dateTime(order.orderDate)}</small>
                                        </td>
                                        <td>
                                            <strong>{order.customerName}</strong>
                                        </td>
                                        <td>{order.totalItems} cuốn</td>
                                        <td>{money(order.finalAmount)}</td>
                                        <td>
                                            {order.packingIssue ? (
                                                <span className={`${common.badge} ${common.badgeGold}`}>
                                                    <AlertTriangle size={12} /> Có sự cố kho
                                                </span>
                                            ) : (
                                                <span className={common.badge}>
                                                    <Clock3 size={12} /> Chờ đóng gói
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                className={styles.detailButton}
                                                disabled={packing.loadingDetail}
                                                onClick={() => {
                                                    setChecked(false);
                                                    setIssue(false);
                                                    setReason('');
                                                    void packing.select(order.orderId);
                                                }}
                                            >
                                                Soạn & đóng gói <ArrowRight size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {packing.orders.data && (
                    <BookPagination
                        variant="admin"
                        page={packing.query.pageNumber}
                        pageSize={packing.query.pageSize}
                        totalCount={packing.orders.data.totalCount}
                        itemLabel="đơn hàng"
                        onPageChange={(pageNumber) => packing.setQuery({ ...packing.query, pageNumber })}
                        onPageSizeChange={(pageSize) =>
                            packing.setQuery({ ...packing.query, pageNumber: 1, pageSize })
                        }
                    />
                )}
            </section>
            <p className={styles.scopeNote}>
                <ClipboardCheck size={15} /> Chỉ tiếp nhận đơn Đã xác nhận. Phân công Shipper được thực hiện
                tại màn hình điều phối.
            </p>
            {packing.selected && (
                <WorkflowModal
                    title={`Soạn đơn ORD-${packing.selected.orderId}`}
                    busy={packing.busy}
                    onClose={() => packing.setSelected(null)}
                >
                    <div className={common.dialogBody}>
                        <div className={styles.recipient}>
                            <span className={common.eyebrow}>THÔNG TIN NGƯỜI NHẬN</span>
                            <h3>{packing.selected.customerName}</h3>
                            <p>
                                <Phone size={14} />
                                {packing.selected.receiverPhone || 'Chưa cập nhật số điện thoại'}
                            </p>
                            <p>
                                <MapPin size={14} />
                                {packing.selected.shippingAddress}
                            </p>
                        </div>
                        {packing.error && <WorkflowError message={packing.error} />}
                        {packing.selected.packingIssue && (
                            <div className={styles.issueNotice}>
                                <AlertTriangle size={18} />
                                <div>
                                    <strong>Sự cố đã ghi nhận</strong>
                                    <p>{packing.selected.packingIssue}</p>
                                </div>
                            </div>
                        )}
                        <section>
                            <h3 className={styles.sectionTitle}>
                                Sách cần đóng gói{' '}
                                <span>
                                    {packing.selected.items.reduce((sum, item) => sum + item.quantity, 0)}{' '}
                                    cuốn
                                </span>
                            </h3>
                            {packing.selected.items.map((item, index) => (
                                <div className={common.bookRow} key={`${item.bookId}-${index}`}>
                                    <BookCover
                                        src={item.bookCover ?? undefined}
                                        title={item.bookTitle}
                                        className={common.bookCover}
                                    />
                                    <div>
                                        <h3>{item.bookTitle}</h3>
                                        <p>{money(item.unitPrice)} / cuốn</p>
                                    </div>
                                    <strong className={styles.quantity}>× {item.quantity}</strong>
                                </div>
                            ))}
                        </section>
                        {issue ? (
                            <div className={styles.issueForm}>
                                <div className={common.actionRow}>
                                    <strong>Báo cáo sự cố kho</strong>
                                    <button
                                        type="button"
                                        className={common.textButton}
                                        aria-label="Đóng biểu mẫu sự cố"
                                        onClick={() => setIssue(false)}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                                <label className={common.field}>
                                    Lý do sự cố
                                    <textarea
                                        value={reason}
                                        maxLength={1000}
                                        rows={3}
                                        onChange={(event) => setReason(event.target.value)}
                                        placeholder="Ví dụ: sách bị hư, cần kiểm tra lại trước khi đóng gói..."
                                    />
                                    <small>
                                        {reason.length}/1.000 ký tự · Đơn giữ nguyên trạng thái Đã xác nhận.
                                    </small>
                                </label>
                            </div>
                        ) : (
                            <label className={common.checkbox}>
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(event) => setChecked(event.target.checked)}
                                />
                                Tôi đã đối chiếu đúng sách, đủ số lượng và đóng gói hoàn tất.
                            </label>
                        )}
                    </div>
                    <footer className={common.dialogFooter}>
                        {issue ? (
                            <>
                                <button
                                    type="button"
                                    className={common.secondary}
                                    disabled={packing.busy}
                                    onClick={() => setIssue(false)}
                                >
                                    Quay lại
                                </button>
                                <button
                                    type="button"
                                    className={common.primary}
                                    disabled={packing.busy || !reason.trim()}
                                    onClick={() =>
                                        void packing.save(reason.trim()).then((saved) => {
                                            if (saved) {
                                                setIssue(false);
                                                setReason('');
                                            }
                                        })
                                    }
                                >
                                    {packing.busy ? 'Đang gửi...' : 'Gửi báo cáo sự cố'}
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    className={common.secondary}
                                    disabled={packing.busy}
                                    onClick={() => setIssue(true)}
                                >
                                    <AlertTriangle size={15} /> Báo sự cố
                                </button>
                                <button
                                    type="button"
                                    className={common.primary}
                                    disabled={!checked || packing.busy}
                                    onClick={() => void packing.save()}
                                >
                                    <CheckCircle2 size={16} />
                                    {packing.busy ? 'Đang lưu...' : 'Xác nhận đóng gói xong'}
                                </button>
                            </>
                        )}
                    </footer>
                </WorkflowModal>
            )}
        </AdminLayout>
    );
}

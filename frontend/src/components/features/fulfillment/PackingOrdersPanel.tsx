import {
    AlertTriangle,
    ArrowRight,
    Clock3,
    RefreshCw,
    Search,
} from 'lucide-react';
import BookPagination from '../../common/BookPagination';
import { EmptyState, WorkflowError } from '../workflow/WorkflowShared';
import { workflowDateTime, workflowMoney } from '../../../utils/workflowPresentation';
import { useFulfillment } from '../../../hooks/useFulfillment';
import common from '../workflow/Workflow.module.css';
import styles from './Fulfillment.module.css';

type Fulfillment = ReturnType<typeof useFulfillment>;

interface PackingOrdersPanelProps {
    packing: Fulfillment;
    onOpenDetail: (orderId: number) => void;
}

export default function PackingOrdersPanel({
    packing,
    onOpenDetail,
}: PackingOrdersPanelProps) {
    return (
        <>
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
                                            <small>{workflowDateTime(order.orderDate)}</small>
                                        </td>
                                        <td>
                                            <strong>{order.customerName}</strong>
                                        </td>
                                        <td>{order.totalItems} cuốn</td>
                                        <td>{workflowMoney(order.finalAmount)}</td>
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
                                                onClick={() => onOpenDetail(order.orderId)}
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
        </>
    );
}

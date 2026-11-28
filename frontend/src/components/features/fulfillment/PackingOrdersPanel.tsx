import { useState } from 'react';
import {
    AlertTriangle,
    ArrowRight,
    Clock3,
    Printer,
    RefreshCw,
    Search,
} from 'lucide-react';
import BookPagination from '../../common/BookPagination';
import { EmptyState, WorkflowError } from '../workflow/WorkflowShared';
import { workflowDateTime, workflowMoney } from '../../../utils/workflowPresentation';
import { useFulfillment } from '../../../hooks/useFulfillment';
import {
    fulfillmentOrderCode,
    openWavePrintTarget,
    printWavePicking,
} from './fulfillmentPrint';
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
    const [storedSelectedIds, setStoredSelectedIds] = useState<number[]>([]);
    const visibleOrders = packing.orders.data?.items;
    const visibleIds = visibleOrders?.map((order) => order.orderId) ?? [];
    const selectedIds = storedSelectedIds.filter((id) => visibleIds.includes(id));
    const allVisibleSelected =
        visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

    const toggleOrder = (orderId: number, selected: boolean) => {
        setStoredSelectedIds(
            selected
                ? [...new Set([...selectedIds, orderId])]
                : selectedIds.filter((id) => id !== orderId),
        );
    };
    const toggleVisible = (selected: boolean) => {
        setStoredSelectedIds(selected ? visibleIds : []);
    };
    const printSelectedWave = async () => {
        let target: Window;
        try {
            target = openWavePrintTarget();
        } catch (cause) {
            packing.setError(cause instanceof Error ? cause.message : 'Không thể mở cửa sổ in.');
            return;
        }

        const details = await packing.loadWaveDetails(selectedIds);
        if (!details) {
            target.close();
            return;
        }
        try {
            printWavePicking(details, target);
            setStoredSelectedIds([]);
        } catch (cause) {
            target.close();
            packing.setError(cause instanceof Error ? cause.message : 'Không thể tạo phiếu lấy hàng.');
        }
    };

    return (
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
                    setStoredSelectedIds([]);
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

            {visibleOrders && visibleOrders.length > 0 && (
                <div className={styles.waveToolbar}>
                    <div>
                        <strong>{selectedIds.length}</strong> đơn đang chọn
                        <span> · Chỉ các đơn chờ đóng gói trên trang hiện tại</span>
                    </div>
                    <button
                        type="button"
                        className={common.secondary}
                        disabled={selectedIds.length === 0 || packing.waveBusy}
                        onClick={() => void printSelectedWave()}
                    >
                        <Printer size={15} />
                        {packing.waveBusy ? 'Đang tạo phiếu...' : 'In phiếu lấy hàng theo đợt'}
                    </button>
                </div>
            )}

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
            ) : visibleOrders?.length === 0 ? (
                <EmptyState
                    title="Không có đơn cần đóng gói"
                    detail="Đổi bộ lọc hoặc làm mới để kiểm tra đơn vừa xác nhận."
                />
            ) : (
                <div className={common.tableScroll}>
                    <table className={common.table}>
                        <thead>
                            <tr>
                                <th className={styles.selectColumn}>
                                    <input
                                        type="checkbox"
                                        checked={allVisibleSelected}
                                        aria-label="Chọn tất cả đơn chờ đóng gói trên trang này"
                                        onChange={(event) => toggleVisible(event.target.checked)}
                                    />
                                </th>
                                <th>Mã đơn / Thời gian</th>
                                <th>Khách hàng</th>
                                <th>Số lượng</th>
                                <th>Đơn vị vận chuyển</th>
                                <th>Mức ưu tiên</th>
                                <th>Thanh toán</th>
                                <th>Trạng thái kho</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleOrders?.map((order) => {
                                const orderCode = fulfillmentOrderCode(order.orderId, order.orderCode);
                                return (
                                    <tr key={order.orderId}>
                                        <td className={styles.selectColumn}>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(order.orderId)}
                                                aria-label={`Chọn ${orderCode} để in phiếu lấy hàng theo đợt`}
                                                onChange={(event) =>
                                                    toggleOrder(order.orderId, event.target.checked)
                                                }
                                            />
                                        </td>
                                        <td>
                                            <strong className={styles.orderCode}>{orderCode}</strong>
                                            <small>{workflowDateTime(order.orderDate)}</small>
                                        </td>
                                        <td>
                                            <strong>{order.customerName}</strong>
                                        </td>
                                        <td>{order.totalItems} cuốn</td>
                                        <td>
                                            <span className={styles.carrier}>{order.shippingCarrier || 'AncientBook Delivery'}</span>
                                        </td>
                                        <td>
                                            <span className={order.deliveryPriority === 'Express'
                                                ? `${common.badge} ${common.badgeGold}`
                                                : common.badge}>
                                                {order.deliveryPriority === 'Express' ? 'Hỏa tốc' : 'Đơn thường'}
                                            </span>
                                        </td>
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
                                );
                            })}
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
                    onPageChange={(pageNumber) => {
                        setStoredSelectedIds([]);
                        packing.setQuery({ ...packing.query, pageNumber });
                    }}
                    onPageSizeChange={(pageSize) => {
                        setStoredSelectedIds([]);
                        packing.setQuery({ ...packing.query, pageNumber: 1, pageSize });
                    }}
                />
            )}
        </section>
    );
}

import {
    ArrowDownLeft,
    ArrowRight,
    ArrowUpRight,
    ChevronRight,
    Clock3,
    Coins,
    Gift,
    LockKeyhole,
} from 'lucide-react';
import { useLoyalty } from '../../../hooks/useLoyalty';
import BookPagination from '../../common/BookPagination';
import { EmptyState } from '../workflow/WorkflowShared';
import {
    workflowDate,
    workflowDateTime,
    workflowMoney,
    workflowNumber,
} from '../../../utils/workflowPresentation';
import common from '../workflow/Workflow.module.css';
import styles from './Loyalty.module.css';

type Loyalty = ReturnType<typeof useLoyalty>;

interface PointsHistorySectionProps {
    loyalty: Loyalty;
    amount: string;
    points: string;
    setAmount: (value: string) => void;
    setPoints: (value: string) => void;
    maxPreview: number;
}

export default function PointsHistorySection({
    loyalty,
    amount,
    points,
    setAmount,
    setPoints,
    maxPreview,
}: PointsHistorySectionProps) {
    const data = loyalty.resource.data;
    if (!data) return null;
    return (
        <>
            <section className={`${common.panel} ${styles.history}`}>
                <div className={common.panelHeader}>
                    <h2>Lịch sử giao dịch điểm</h2>
                    <span className={common.muted}>
                        {data.history.totalCount} giao dịch
                    </span>
                </div>
                {data.history.items.length === 0 ? (
                    <EmptyState
                        title="Chưa có giao dịch điểm"
                        detail="Điểm từ đơn hàng và đánh giá hợp lệ sẽ xuất hiện tại đây."
                    />
                ) : (
                    <div className={common.tableScroll}>
                        <table className={common.table}>
                            <thead>
                                <tr>
                                    <th>Giao dịch</th>
                                    <th>Điểm</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.history.items.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <div className={styles.transaction}>
                                                <span
                                                    className={`${styles.transactionIcon} ${item.pointUsed > 0 ? styles.debitIcon : ''}`}
                                                >
                                                    {item.status === 'Pending' ? (
                                                        <Clock3 size={17} />
                                                    ) : item.pointUsed > 0 ? (
                                                        <ArrowUpRight size={17} />
                                                    ) : (
                                                        <ArrowDownLeft size={17} />
                                                    )}
                                                </span>
                                                <div>
                                                    <strong>
                                                        {item.description ||
                                                            (item.pointUsed > 0
                                                                ? 'Sử dụng F-Point'
                                                                : 'Tích lũy F-Point')}
                                                    </strong>
                                                    <small>{workflowDateTime(item.createdAt)}</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <strong
                                                className={
                                                    item.status === 'Cancelled'
                                                        ? styles.cancelled
                                                        : item.pointUsed > 0
                                                            ? styles.debit
                                                            : styles.credit
                                                }
                                            >
                                                {item.pointUsed <= 0 ? '+' : '−'}
                                                {workflowNumber(Math.abs(item.pointUsed))}
                                            </strong>
                                        </td>
                                        <td>
                                            <span
                                                className={`${common.badge} ${item.status === 'Pending' ? common.badgeGold : item.status === 'Cancelled' ? common.badgeGray : common.badgeGreen}`}
                                            >
                                                {item.status === 'Pending'
                                                    ? 'Chờ duyệt'
                                                    : item.status === 'Cancelled'
                                                        ? 'Đã hủy'
                                                        : item.pointUsed > 0
                                                            ? 'Đã sử dụng'
                                                            : 'Đã vào ví'}
                                            </span>
                                            {item.status === 'Pending' && item.availableAt && (
                                                <small>
                                                    Dự kiến: {workflowDate(item.availableAt)}
                                                </small>
                                            )}
                                        </td>
                                        <td>
                                            {item.status === 'Pending' && item.orderId && (
                                                <button
                                                    type="button"
                                                    className={styles.receiptButton}
                                                    disabled={loyalty.busy}
                                                    onClick={() => {
                                                        void loyalty.openReceipt(item.orderId!);
                                                    }}
                                                >
                                                    Xác nhận nhận hàng
                                                    <ChevronRight size={12} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <BookPagination
                    page={loyalty.page}
                    pageSize={10}
                    totalCount={data.history.totalCount}
                    pageSizes={[10]}
                    onPageChange={loyalty.setPage}
                    onPageSizeChange={() => {}}
                    itemLabel="giao dịch"
                />
            </section>
            <div className={styles.bottomGrid}>
                <section className={common.panel}>
                    <div className={common.panelHeader}>
                        <h2>
                            <Coins size={17} />
                            Xem trước mức giảm
                        </h2>
                    </div>
                    <form
                        className={common.panelBody}
                        onSubmit={(event) => {
                            event.preventDefault();
                            void loyalty.preview(Number(points), Number(amount));
                        }}
                    >
                        <div className={common.twoColumns}>
                            <label className={common.field}>
                                Tiền sách (đ)
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]+"
                                    value={amount}
                                    onChange={(event) => {
                                        if (!/^\d*$/.test(event.target.value)) return;
                                        setAmount(event.target.value);
                                        loyalty.setPreviewResult(null);
                                    }}
                                    required
                                />
                            </label>
                            <label className={common.field}>
                                Số F-Point muốn dùng
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]+"
                                    value={points}
                                    onChange={(event) => {
                                        if (!/^\d*$/.test(event.target.value)) return;
                                        setPoints(event.target.value);
                                        loyalty.setPreviewResult(null);
                                    }}
                                    required
                                />
                            </label>
                        </div>
                        <p className={styles.limit}>
                            Tối đa theo số dư và tiền sách: {workflowNumber(maxPreview)} điểm.
                            Hạn mức cấu hình được kiểm tra khi xem trước.
                        </p>
                        <button
                            type="submit"
                            className={common.primary}
                            disabled={loyalty.busy}
                        >
                            Tính mức giảm <ArrowRight size={15} />
                        </button>
                        {loyalty.previewResult && (
                            <div className={styles.previewResult}>
                                <span>
                                    Giảm {workflowMoney(loyalty.previewResult.discountAmount)}
                                </span>
                                <strong>
                                    Còn {workflowMoney(loyalty.previewResult.finalAmount)}
                                </strong>
                                <small>
                                    Chưa trừ điểm. Điểm chỉ bị trừ khi đặt hàng thành
                                    công.
                                </small>
                            </div>
                        )}
                    </form>
                </section>
                <section className={`${common.panel} ${styles.rules}`}>
                    <h2>Dùng điểm như thế nào?</h2>
                    <p>
                        <Coins size={17} />
                        <span>
                            <strong>1 F-Point = 100 đ</strong>Chỉ dùng điểm khả dụng
                            để giảm tiền sách.
                        </span>
                    </p>
                    <p>
                        <LockKeyhole size={17} />
                        <span>
                            <strong>Điểm chờ chưa thể sử dụng</strong>Mở điểm khi đủ
                            điều kiện nhận hàng hoặc hết hạn đổi trả.
                        </span>
                    </p>
                    <p>
                        <Gift size={17} />
                        <span>
                            <strong>Tối đa 1.000 điểm mỗi đơn</strong>Không vượt 50%
                            tiền sách và hạn mức cấu hình. Không giảm phí vận chuyển.
                        </span>
                    </p>
                </section>
            </div>
        </>
    );
}

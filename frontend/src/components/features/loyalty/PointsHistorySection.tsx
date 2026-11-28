import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowDownLeft,
    CalendarDays,
    ArrowRight,
    ArrowUpRight,
    ChevronRight,
    Clock3,
    Coins,
    Gift,
    LockKeyhole,
    RotateCcw,
    Search,
    SlidersHorizontal,
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
    onOpenPolicy: () => void;
}

const transactionLabels = {
    Earn: 'Tích điểm',
    Redeem: 'Sử dụng điểm',
    Refund: 'Hoàn điểm',
} as const;

const vietnamDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
});
const toVietnamDateInput = (value: Date) => vietnamDate.format(value);

export default function PointsHistorySection({
    loyalty,
    amount,
    points,
    setAmount,
    setPoints,
    maxPreview,
    onOpenPolicy,
}: PointsHistorySectionProps) {
    const data = loyalty.resource.data;
    const [period, setPeriod] = useState<'all' | '30days' | '3months' | 'custom'>('all');
    if (!data) return null;
    const today = toVietnamDateInput(new Date());
    const setQuickPeriod = (value: 'all' | '30days' | '3months' | 'custom') => {
        setPeriod(value);
        if (value === 'custom') return;
        if (value === 'all') {
            loyalty.setHistoryFilter('fromDate', '');
            loyalty.setHistoryFilter('toDate', '');
            return;
        }
        const from = new Date(Date.now() - (value === '30days' ? 29 : 89) * 86_400_000);
        loyalty.setHistoryFilter('fromDate', toVietnamDateInput(from));
        loyalty.setHistoryFilter('toDate', today);
    };
    const resetFilters = () => {
        setPeriod('all');
        loyalty.resetHistoryFilters();
    };
    return (
        <>
            <section className={styles.historySummary} aria-label="Tổng hợp giao dịch F-Point">
                <article>
                    <span>Tổng điểm đã tích</span>
                    <strong className={styles.credit}>+{workflowNumber(data.history.totalEarned)}</strong>
                    <small>Trong khoảng thời gian đã chọn</small>
                </article>
                <article>
                    <span>Tổng điểm đã sử dụng</span>
                    <strong className={styles.debit}>−{workflowNumber(data.history.totalRedeemed)}</strong>
                    <small>Quy đổi 1 điểm = 100 đ</small>
                </article>
                <article>
                    <span>Tổng điểm đã hoàn</span>
                    <strong className={styles.refund}>+{workflowNumber(data.history.totalRefunded)}</strong>
                    <small>Hoàn từ đơn bị hủy hoặc trả</small>
                </article>
            </section>

            <section className={`${common.panel} ${styles.history}`}>
                <div className={common.panelHeader}>
                    <div>
                        <h2>Lịch sử giao dịch điểm</h2>
                        <span className={common.muted}>
                            {data.history.totalCount} giao dịch phù hợp
                        </span>
                    </div>
                    <button type="button" className={common.secondary} onClick={onOpenPolicy}>
                        <SlidersHorizontal size={14} /> Quy tắc tích & tiêu điểm
                    </button>
                </div>
                <form
                    className={styles.historyFilters}
                    onSubmit={(event) => {
                        event.preventDefault();
                        loyalty.applyHistoryFilters();
                    }}
                >
                    <label>
                        Khoảng thời gian
                        <select
                            value={period}
                            onChange={(event) => setQuickPeriod(event.target.value as typeof period)}
                        >
                            <option value="all">Tất cả thời gian</option>
                            <option value="30days">30 ngày gần đây</option>
                            <option value="3months">3 tháng gần đây</option>
                            <option value="custom">Tùy chọn ngày</option>
                        </select>
                    </label>
                    {period === 'custom' && (
                        <div className={styles.customDates}>
                            <label>
                                Từ ngày
                                <input
                                    type="date"
                                    max={loyalty.historyFilters.toDate || today}
                                    value={loyalty.historyFilters.fromDate ?? ''}
                                    onChange={(event) => loyalty.setHistoryFilter('fromDate', event.target.value)}
                                />
                            </label>
                            <label>
                                Đến ngày
                                <input
                                    type="date"
                                    min={loyalty.historyFilters.fromDate}
                                    max={today}
                                    value={loyalty.historyFilters.toDate ?? ''}
                                    onChange={(event) => loyalty.setHistoryFilter('toDate', event.target.value)}
                                />
                            </label>
                        </div>
                    )}
                    <label>
                        Loại giao dịch
                        <select
                            value={loyalty.historyFilters.transactionType ?? ''}
                            onChange={(event) =>
                                loyalty.setHistoryFilter('transactionType', event.target.value)
                            }
                        >
                            <option value="">Tất cả giao dịch</option>
                            <option value="Earn">Tích điểm</option>
                            <option value="Redeem">Sử dụng điểm</option>
                            <option value="Refund">Hoàn điểm</option>
                        </select>
                    </label>
                    <div className={styles.filterActions}>
                        <button type="submit" className={common.primary} disabled={loyalty.resource.loading}>
                            <Search size={14} /> Lọc
                        </button>
                        <button
                            type="button"
                            className={common.secondary}
                            onClick={resetFilters}
                            disabled={loyalty.resource.loading}
                        >
                            <RotateCcw size={14} /> Đặt lại
                        </button>
                    </div>
                </form>
                {data.history.items.length === 0 ? (
                    <div className={styles.historyEmpty}>
                        <EmptyState
                            title={data.balance.totalPointsEarned === 0
                                ? 'Bạn chưa có biến động điểm thưởng nào'
                                : 'Không có biến động điểm nào trong khoảng thời gian đã chọn'}
                            detail={data.balance.totalPointsEarned === 0
                                ? 'Hãy mua cuốn sách đầu tiên để bắt đầu tích lũy điểm thưởng!'
                                : 'Đặt lại bộ lọc để xem toàn bộ lịch sử F-Point.'}
                        />
                        {data.balance.totalPointsEarned === 0 ? (
                            <Link className={styles.emptyLink} to="/">
                                <CalendarDays size={14} /> Khám phá sách ngay
                            </Link>
                        ) : (
                            <button type="button" className={common.secondary} onClick={resetFilters}>
                                <RotateCcw size={14} /> Đặt lại bộ lọc
                            </button>
                        )}
                    </div>
                ) : (
                    <div className={common.tableScroll}>
                        <table className={common.table}>
                            <thead>
                                <tr>
                                    <th>Thời gian</th>
                                    <th>Mã đơn hàng</th>
                                    <th>Loại giao dịch</th>
                                    <th>Số điểm</th>
                                    <th>Số dư sau giao dịch</th>
                                    <th>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.history.items.map((item) => {
                                    const isCredit = item.transactionType !== 'Redeem';
                                    const statusLabel = item.status === 'Pending'
                                        ? 'Chờ hiệu lực'
                                        : item.status === 'Cancelled'
                                            ? item.transactionType === 'Redeem' ? 'Đã hoàn' : 'Đã hủy'
                                            : item.transactionType === 'Redeem'
                                                ? 'Đã sử dụng'
                                                : item.transactionType === 'Refund'
                                                    ? 'Đã hoàn'
                                                    : 'Đã vào ví';
                                    return (
                                        <tr key={item.id}>
                                            <td className={styles.dateCell}>
                                                {workflowDateTime(item.createdAt)}
                                            </td>
                                            <td>
                                                {item.orderId ? <strong>#{item.orderId}</strong> : <span className={common.muted}>—</span>}
                                            </td>
                                            <td>
                                                <div className={styles.transaction}>
                                                    <span
                                                        className={`${styles.transactionIcon} ${!isCredit ? styles.debitIcon : ''}`}
                                                    >
                                                        {item.status === 'Pending' ? (
                                                            <Clock3 size={17} />
                                                        ) : !isCredit ? (
                                                            <ArrowUpRight size={17} />
                                                        ) : (
                                                            <ArrowDownLeft size={17} />
                                                        )}
                                                    </span>
                                                    <div>
                                                        <strong>{transactionLabels[item.transactionType]}</strong>
                                                        <small>{item.description}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <strong
                                                    className={
                                                        item.status === 'Cancelled'
                                                            ? styles.cancelled
                                                            : isCredit ? styles.credit : styles.debit
                                                    }
                                                >
                                                    {isCredit ? '+' : '−'}
                                                    {workflowNumber(Math.abs(item.pointUsed))}
                                                </strong>
                                            </td>
                                            <td>
                                                <strong>{workflowNumber(item.balanceAfter)}</strong>
                                                <small className={styles.balanceValue}>F-Point</small>
                                            </td>
                                            <td>
                                                <span
                                                    className={`${common.badge} ${item.status === 'Pending' ? common.badgeGold : item.status === 'Cancelled' ? common.badgeGray : common.badgeGreen}`}
                                                >
                                                    {statusLabel}
                                                </span>
                                                {item.status === 'Pending' && item.availableAt && (
                                                    <small>Dự kiến: {workflowDate(item.availableAt)}</small>
                                                )}
                                                {item.status === 'Pending' && item.orderId && (
                                                    <button
                                                        type="button"
                                                        className={styles.receiptButton}
                                                        disabled={loyalty.busy}
                                                        onClick={() => void loyalty.openReceipt(item.orderId!)}
                                                    >
                                                        Xác nhận nhận hàng <ChevronRight size={12} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
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
                        <button type="submit" className={common.primary} disabled={loyalty.busy}>
                            Tính mức giảm <ArrowRight size={15} />
                        </button>
                        {loyalty.previewResult && (
                            <div className={styles.previewResult}>
                                <span>Giảm {workflowMoney(loyalty.previewResult.discountAmount)}</span>
                                <strong>Còn {workflowMoney(loyalty.previewResult.finalAmount)}</strong>
                                <small>Chưa trừ điểm. Điểm chỉ bị trừ khi đặt hàng thành công.</small>
                            </div>
                        )}
                    </form>
                </section>
                <section className={`${common.panel} ${styles.rules}`}>
                    <h2>Dùng điểm như thế nào?</h2>
                    <p>
                        <Coins size={17} />
                        <span><strong>1 F-Point = 100 đ</strong>Chỉ dùng điểm khả dụng để giảm tiền sách.</span>
                    </p>
                    <p>
                        <LockKeyhole size={17} />
                        <span><strong>Điểm chờ chưa thể sử dụng</strong>Mở điểm khi đủ điều kiện nhận hàng hoặc hết hạn đổi trả.</span>
                    </p>
                    <p>
                        <Gift size={17} />
                        <span><strong>Tối đa 1.000 điểm mỗi đơn</strong>Không vượt tiền sách và hạn mức cấu hình. Không giảm phí vận chuyển.</span>
                    </p>
                </section>
            </div>
        </>
    );
}

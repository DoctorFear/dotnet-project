import { useState } from 'react';
import {
    BookOpen,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Clock3,
    LogOut,
    MapPin,
    Package,
    Phone,
    RefreshCw,
    Search,
    ShieldCheck,
    Truck,
    UserRound,
    Wallet,
    XCircle,
} from 'lucide-react';
import { useShipperPortal } from '../hooks/useShipperPortal';
import { useUser } from '../context/UserContext';
import { useWorkflow } from '../context/WorkflowContext';
import { useAuthAction } from '../hooks/useAuthAction';
import ToastNotification from '../components/common/ToastNotification';
import {
    dateTime,
    EmptyState,
    money,
    WorkflowError,
    WorkflowModal,
} from '../components/features/workflow/WorkflowShared';
import type { DeliveryStatus } from '../types/workflow';
import styles from './ShipperPortalPage.module.css';
import common from '../components/features/workflow/Workflow.module.css';

const statusText: Record<DeliveryStatus, string> = {
    Pending: 'Chờ xác nhận',
    Confirmed: 'Đã xác nhận',
    Prepared: 'Chờ lấy hàng',
    Shipping: 'Đang giao',
    Completed: 'Hoàn thành',
    Failed: 'Thất bại',
    ReturnRequested: 'Chờ duyệt hoàn trả',
    ReturnApproved: 'Đã duyệt hoàn trả',
    Returned: 'Hoàn trả thành công',
};
const tabs = [
    { value: '', label: 'Tất cả' },
    ...(['Prepared', 'Shipping', 'Completed', 'Failed'] as const).map((value) => ({
        value,
        label: statusText[value],
    })),
];

export default function ShipperPortalPage() {
    const shipper = useShipperPortal();
    const { user } = useUser();
    const { preview } = useWorkflow();
    const { handleLogout } = useAuthAction();
    const [account, setAccount] = useState(false);
    const [result, setResult] = useState<'Completed' | 'Failed' | ''>('');
    const [reason, setReason] = useState('');
    const [note, setNote] = useState('');
    const [codConfirmed, setCodConfirmed] = useState(false);
    const openAction = (id: number, status: DeliveryStatus) => {
        setResult('');
        setReason('');
        setNote('');
        setCodConfirmed(false);
        void shipper.openAction(id, status);
    };
    const selected = shipper.detail;
    const valid =
        shipper.action === 'start' ||
        (result === 'Failed' && !!reason) ||
        (result === 'Completed' && (selected?.codAmount === 0 || codConfirmed));
    return (
        <div className={styles.viewport}>
            <div className={styles.phone}>
                <ToastNotification
                    toasts={shipper.notifications.toasts}
                    onClose={shipper.notifications.dismissToast}
                />
                <header className={styles.header}>
                    <div className={styles.topline}>
                        <span className={styles.brand}>
                            ancient<span>BOOK</span>
                            <i />
                        </span>
                        <span className={styles.portal}>SHIPPER</span>
                        <button type="button" aria-label="Làm mới đơn hàng" onClick={shipper.orders.reload}>
                            <RefreshCw size={19} />
                        </button>
                    </div>
                    <p>
                        Xin chào, {preview ? 'Hoàng Khang' : user?.fullName || user?.username || 'bạn'}{' '}
                        <span className={styles.wave}>✦</span>
                    </p>
                    <h1>Đơn hàng của tôi</h1>
                    <span className={styles.headerCaption}>
                        <ShieldCheck size={14} /> Chỉ hiển thị đơn được phân công cho bạn
                    </span>
                </header>
                <main className={styles.content}>
                    <form
                        className={styles.search}
                        onSubmit={(event) => {
                            event.preventDefault();
                            shipper.search(String(new FormData(event.currentTarget).get('keyword') ?? ''));
                        }}
                    >
                        <Search size={18} />
                        <input
                            name="keyword"
                            aria-label="Tìm mã đơn hoặc tên khách"
                            placeholder="Tìm mã đơn, tên khách hàng..."
                        />
                        <button type="submit" aria-label="Tìm kiếm đơn">
                            <ChevronRight size={18} />
                        </button>
                    </form>
                    <div className={styles.tabs} role="tablist" aria-label="Trạng thái giao hàng">
                        {tabs.map((tab) => (
                            <button
                                type="button"
                                role="tab"
                                aria-selected={shipper.status === tab.value}
                                key={tab.value}
                                onClick={() => shipper.filter(tab.value)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <div className={styles.resultHeading}>
                        <span>{shipper.orders.data?.totalCount ?? '—'} đơn hàng</span>
                        <small>
                            <Clock3 size={12} /> Ưu tiên đơn chưa hoàn tất
                        </small>
                    </div>
                    {shipper.error && !shipper.action && <WorkflowError message={shipper.error} />}
                    {shipper.orders.error ? (
                        <WorkflowError message={shipper.orders.error} retry={shipper.orders.reload} />
                    ) : shipper.orders.loading ? (
                        <div className={styles.loading} role="status">
                            Đang tải đơn được phân công...
                        </div>
                    ) : shipper.orders.data?.items.length === 0 ? (
                        <EmptyState
                            title="Chưa có đơn phù hợp"
                            detail="Thử đổi trạng thái hoặc từ khóa tìm kiếm."
                        />
                    ) : (
                        shipper.orders.data?.items.map((order) => {
                            const expanded = shipper.detailId === order.orderId;
                            const active = order.status === 'Prepared' || order.status === 'Shipping';
                            const detail = expanded ? selected : null;
                            return (
                                <article className={styles.order} key={order.orderId}>
                                    <div className={styles.orderTop}>
                                        <span className={styles.packageIcon}>
                                            <Package size={19} />
                                        </span>
                                        <div>
                                            <h2>{order.orderCode}</h2>
                                            <small>{dateTime(order.orderDate)}</small>
                                        </div>
                                        <span className={`${styles.status} ${styles[order.status] ?? ''}`}>
                                            {statusText[order.status]}
                                        </span>
                                    </div>
                                    <div className={styles.orderBody}>
                                        <h3>{order.customerName}</h3>
                                        <p className={styles.address}>
                                            <MapPin size={16} />
                                            <span>{order.shippingAddress}</span>
                                        </p>
                                        <div className={styles.cod}>
                                            <span>
                                                <Wallet size={15} />{' '}
                                                {active ? 'Tiền COD cần thu' : 'Giá trị đơn hàng'}
                                            </span>
                                            <strong>
                                                {money(active ? order.codAmount : order.finalAmount)}
                                            </strong>
                                        </div>
                                        {active && order.isPaid && (
                                            <p className={styles.prepaid}>
                                                <CheckCircle2 size={13} /> Đã thanh toán trước · Không thu
                                                thêm tiền
                                            </p>
                                        )}
                                        <button
                                            type="button"
                                            className={styles.detailToggle}
                                            disabled={shipper.detailLoading}
                                            aria-expanded={expanded}
                                            onClick={() => void shipper.openDetail(order.orderId)}
                                        >
                                            {expanded ? 'Thu gọn chi tiết' : 'Xem chi tiết đơn'}
                                            <ChevronDown
                                                size={15}
                                                style={{ transform: expanded ? 'rotate(180deg)' : undefined }}
                                            />
                                        </button>
                                        {expanded &&
                                            (shipper.detailLoading ? (
                                                <p role="status">Đang tải chi tiết...</p>
                                            ) : (
                                                detail && (
                                                    <div className={styles.detail}>
                                                        <a
                                                            className={styles.phoneLink}
                                                            href={
                                                                detail.receiverPhone
                                                                    ? `tel:${detail.receiverPhone}`
                                                                    : undefined
                                                            }
                                                        >
                                                            <Phone size={16} />
                                                            <span>
                                                                {detail.receiverPhone ||
                                                                    'Chưa có số điện thoại'}
                                                            </span>
                                                        </a>
                                                        <div className={styles.bookList}>
                                                            {detail.items.map((item, index) => (
                                                                <div key={`${item.bookId}-${index}`}>
                                                                    <BookOpen size={17} />
                                                                    <span>
                                                                        {item.bookTitle}
                                                                        <small>
                                                                            SL: {item.quantity} ·{' '}
                                                                            {money(item.unitPrice)}
                                                                        </small>
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {[
                                                            'Prepared',
                                                            'Shipping',
                                                            'Completed',
                                                            'Failed',
                                                        ].includes(order.status) && (
                                                            <div className={styles.timeline}>
                                                                <span className={styles.stepDone}>
                                                                    <Check size={12} />
                                                                    Đã chuẩn bị
                                                                </span>
                                                                <span
                                                                    className={
                                                                        order.status !== 'Prepared'
                                                                            ? styles.stepDone
                                                                            : ''
                                                                    }
                                                                >
                                                                    <Truck size={13} />
                                                                    Đang giao
                                                                </span>
                                                                <span
                                                                    className={
                                                                        order.status === 'Completed' ||
                                                                        order.status === 'Failed'
                                                                            ? styles.stepDone
                                                                            : ''
                                                                    }
                                                                >
                                                                    {order.status === 'Failed' ? (
                                                                        <XCircle size={13} />
                                                                    ) : (
                                                                        <Check size={12} />
                                                                    )}
                                                                    {order.status === 'Failed'
                                                                        ? 'Thất bại'
                                                                        : 'Hoàn thành'}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {detail.completedAt && (
                                                            <p className={styles.finalNote}>
                                                                Kết thúc: {dateTime(detail.completedAt)}
                                                            </p>
                                                        )}
                                                        {detail.failureReason && (
                                                            <div className={styles.failure}>
                                                                <strong>{detail.failureReason}</strong>
                                                                {detail.failureNote && (
                                                                    <p>{detail.failureNote}</p>
                                                                )}
                                                            </div>
                                                        )}
                                                        {detail.isReadOnly && (
                                                            <p className={styles.finalNote}>
                                                                <ShieldCheck size={13} /> Trạng thái này chỉ
                                                                cho phép xem.
                                                            </p>
                                                        )}
                                                    </div>
                                                )
                                            ))}
                                        {(order.status === 'Prepared' || order.status === 'Shipping') && (
                                            <button
                                                type="button"
                                                className={styles.primary}
                                                disabled={shipper.detailLoading || shipper.busy}
                                                onClick={() => openAction(order.orderId, order.status)}
                                            >
                                                {order.status === 'Prepared' ? (
                                                    <Truck size={17} />
                                                ) : (
                                                    <ClipboardList size={17} />
                                                )}
                                                {order.status === 'Prepared'
                                                    ? 'Bắt đầu giao'
                                                    : 'Cập nhật giao hàng'}
                                                <ChevronRight size={17} />
                                            </button>
                                        )}
                                    </div>
                                </article>
                            );
                        })
                    )}
                    {shipper.orders.data && shipper.orders.data.totalCount > 10 && (
                        <div className={styles.pagination}>
                            <button
                                type="button"
                                aria-label="Trang trước"
                                disabled={shipper.page === 1}
                                onClick={() => shipper.setPage(shipper.page - 1)}
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span>
                                Trang {shipper.page} / {Math.ceil(shipper.orders.data.totalCount / 10)}
                            </span>
                            <button
                                type="button"
                                aria-label="Trang sau"
                                disabled={shipper.page * 10 >= shipper.orders.data.totalCount}
                                onClick={() => shipper.setPage(shipper.page + 1)}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    )}
                    <p className={styles.footerNote}>
                        <ShieldCheck size={13} /> Mỗi kiện sách, một lần giao tận tâm.
                    </p>
                </main>
                <nav className={styles.bottomNav} aria-label="Điều hướng Shipper">
                    <button
                        type="button"
                        aria-current="page"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                        <ClipboardList size={21} />
                        Đơn hàng
                    </button>
                    <button type="button" onClick={() => setAccount(true)}>
                        <UserRound size={21} />
                        Tài khoản
                    </button>
                </nav>
                {shipper.action && selected && (
                    <WorkflowModal
                        sheet
                        title={shipper.action === 'start' ? 'Bắt đầu giao hàng' : 'Cập nhật giao hàng'}
                        busy={shipper.busy}
                        onClose={() => {
                            shipper.setAction(null);
                            shipper.setError('');
                        }}
                    >
                        <div className={common.dialogBody}>
                            <p className={common.muted}>
                                Đơn {selected.orderCode} · {selected.customerName}
                            </p>
                            {shipper.error && <WorkflowError message={shipper.error} />}
                            {shipper.action === 'start' ? (
                                <div className={common.info}>
                                    <Truck size={24} />
                                    <p>
                                        Xác nhận bạn đã nhận đủ sách từ kho và sẵn sàng giao đến khách hàng.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className={styles.outcomes}>
                                        <button
                                            type="button"
                                            aria-pressed={result === 'Completed'}
                                            onClick={() => setResult('Completed')}
                                        >
                                            <CheckCircle2 size={25} />
                                            <strong>Giao thành công</strong>
                                            <small>Đã giao đủ sách cho khách</small>
                                        </button>
                                        <button
                                            type="button"
                                            aria-pressed={result === 'Failed'}
                                            onClick={() => setResult('Failed')}
                                        >
                                            <XCircle size={25} />
                                            <strong>Giao thất bại</strong>
                                            <small>Ghi nhận lý do và báo Staff</small>
                                        </button>
                                    </div>
                                    {result === 'Completed' && (
                                        <div className={common.info}>
                                            <Wallet size={22} />
                                            <div>
                                                <strong>
                                                    {selected.codAmount
                                                        ? `Thu đủ COD: ${money(selected.codAmount)}`
                                                        : 'Đơn đã thanh toán trước'}
                                                </strong>
                                                <p>
                                                    Điểm thưởng của khách sẽ được ghi chờ duyệt theo thời hạn
                                                    đổi trả.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {result === 'Completed' && selected.codAmount > 0 && (
                                        <label className={common.checkbox}>
                                            <input
                                                type="checkbox"
                                                checked={codConfirmed}
                                                onChange={(event) => setCodConfirmed(event.target.checked)}
                                            />
                                            Tôi đã thu đủ {money(selected.codAmount)} từ khách.
                                        </label>
                                    )}
                                    {result === 'Failed' && (
                                        <>
                                            <label className={common.field}>
                                                Lý do giao thất bại <span>*</span>
                                                <select
                                                    value={reason}
                                                    onChange={(event) => setReason(event.target.value)}
                                                >
                                                    <option value="">Chọn lý do</option>
                                                    {shipper.reasons.map((item) => (
                                                        <option key={item.id} value={item.id}>
                                                            {item.reasonText}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                            <label className={common.field}>
                                                Ghi chú thêm
                                                <textarea
                                                    maxLength={500}
                                                    rows={3}
                                                    placeholder="Mô tả thêm tình huống giao hàng (không bắt buộc)"
                                                    value={note}
                                                    onChange={(event) => setNote(event.target.value)}
                                                />
                                                <small>{note.length}/500 ký tự</small>
                                            </label>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                        <footer className={common.dialogFooter}>
                            <button
                                type="button"
                                className={common.secondary}
                                disabled={shipper.busy}
                                onClick={() => shipper.setAction(null)}
                            >
                                Quay lại
                            </button>
                            <button
                                type="button"
                                className={common.primary}
                                disabled={!valid || shipper.busy}
                                onClick={() =>
                                    void shipper.submit({
                                        newStatus:
                                            shipper.action === 'start'
                                                ? 'Shipping'
                                                : (result as DeliveryStatus),
                                        ...(result === 'Failed'
                                            ? { failureReasonId: Number(reason), failureNote: note.trim() }
                                            : {}),
                                    })
                                }
                            >
                                {shipper.busy ? 'Đang cập nhật...' : 'Xác nhận'}
                            </button>
                        </footer>
                    </WorkflowModal>
                )}
                {account && (
                    <WorkflowModal sheet title="Tài khoản Shipper" onClose={() => setAccount(false)}>
                        <div className={common.dialogBody}>
                            <h3>{preview ? 'Nguyễn Hoàng Khang' : user?.fullName}</h3>
                            <p className={common.muted}>
                                {preview ? 'shipper_khang · Tài khoản mẫu' : user?.username}
                            </p>
                            <div className={common.info}>
                                <ShieldCheck size={23} />
                                <p>
                                    Bạn được xem và cập nhật tiến trình các đơn hàng đã được phân công cho
                                    mình.
                                </p>
                            </div>
                            {!preview && (
                                <button type="button" className={common.secondary} onClick={handleLogout}>
                                    <LogOut size={16} /> Đăng xuất
                                </button>
                            )}
                        </div>
                    </WorkflowModal>
                )}
            </div>
        </div>
    );
}

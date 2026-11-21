import {
    BookOpen,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    ClipboardList,
    MapPin,
    Package,
    Phone,
    ShieldCheck,
    Truck,
    Wallet,
    XCircle,
} from 'lucide-react';
import type { DeliveryOrder, DeliveryStatus } from '../../../types/workflow';
import { useShipperPortal } from '../../../hooks/useShipperPortal';
import { dateTime, money } from '../workflow/WorkflowShared';
import styles from './ShipperPortal.module.css';
import { statusText } from './shipperMeta';

type Shipper = ReturnType<typeof useShipperPortal>;

interface ShipperOrderCardProps {
    order: DeliveryOrder;
    shipper: Shipper;
    onOpenAction: (id: number, status: DeliveryStatus) => void;
}

export default function ShipperOrderCard({
    order,
    shipper,
    onOpenAction,
}: ShipperOrderCardProps) {
    const expanded = shipper.detailId === order.orderId;
    const active = order.status === 'Prepared' || order.status === 'Shipping';
    const detail = expanded ? shipper.detail : null;
    return (
        <article className={styles.order}>
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
                        onClick={() => onOpenAction(order.orderId, order.status)}
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
}

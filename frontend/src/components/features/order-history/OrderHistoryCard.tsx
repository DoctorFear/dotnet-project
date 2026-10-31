import { useState } from 'react';
import type { Order, OrderItem } from '../../../types/order';
import { OrderStatus } from '../../../types/order';
import { bookIdOf, orderStatusLabels, purchaseType, rentalLabel, rewardLabel } from '../../../utils/orderHistory';
import BookCover from '../../common/BookCover';
import OrderHistoryActions, { OrderHistoryNotes } from './OrderHistoryActions';
import styles from './OrderHistoryInteractions.module.css';

export function OrderPoints({ order }: { order: Order }) {
    const label = rewardLabel(order);
    return label ? <span className={`${styles.points} ${label.includes('chờ duyệt') ? styles.pendingPoints : ''}`}>{label}</span> : null;
}

export function OrderProgress({ order }: { order: Order }) {
    const returning = [OrderStatus.ReturnRequested, OrderStatus.ReturnApproved, OrderStatus.Returned].includes(order.status);
    const physical = order.orderItems.some(item => purchaseType(item) === 'physical');
    const shipping = order.status === OrderStatus.Shipping;
    const preparing = [OrderStatus.Pending, OrderStatus.Confirmed, OrderStatus.Prepared].includes(order.status);
    if (!returning && !shipping && !preparing) return null;
    const labels = returning ? ['Đã gửi yêu cầu', 'Staff đã duyệt', 'Hoàn trả thành công'] : shipping ? ['Đã chuẩn bị xong', 'Đang giao', 'Hoàn thành'] : physical ? ['Chờ xác nhận', 'Đã xác nhận', 'Đã chuẩn bị xong'] : ['Chờ xác nhận', 'Hoàn thành'];
    const current = returning ? order.status - OrderStatus.ReturnRequested : shipping ? 1 : physical ? order.status - OrderStatus.Pending : 0;
    return <ol className={styles.progress} aria-label="Tiến trình đơn hàng">{labels.map((label, index) => <li key={label} className={index <= current ? styles.stepDone : ''} aria-current={index === current ? 'step' : undefined}>{label}</li>)}</ol>;
}

export function OrderHistoryItem({ order, item, detail = false }: { order: Order; item: OrderItem; detail?: boolean }) {
    const format = purchaseType(item);
    const review = order.reviews?.find(value => value.itemId ? value.itemId === item.id : value.bookId === bookIdOf(item));
    const visibleReview = review && !review.isHidden && order.status !== OrderStatus.Returned;
    return <div className={styles.product}>
        <div className={styles.productRow}>
            <BookCover src={item.book?.coverImg} title={item.book?.title ?? 'Sách'} className={styles.productCover} />
            <div className={styles.productInfo}><strong>{item.book?.title ?? `Sách #${bookIdOf(item)}`}</strong>{item.book?.author && <p>{item.book.author}</p>}<div className={styles.productMeta}><span className={format === 'physical' ? styles.physical : styles.digital}>{format === 'physical' ? 'Sách vật lý' : format === 'rental' ? 'Thuê E-Book' : 'Mua E-Book'}</span><span>{format === 'rental' ? rentalLabel(item) : `x${item.quantity}`}</span></div></div>
            <div className={styles.productPrice}>{(detail || item.quantity > 1) && <small>Đơn giá: {item.unitPrice.toLocaleString('vi-VN')} đ</small>}<strong>{(item.unitPrice * item.quantity).toLocaleString('vi-VN')} đ</strong><OrderHistoryActions order={order} item={item} /></div>
        </div>
        {visibleReview && <div className={styles.review}><span className={styles.reviewStars}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span><span>Bạn đã đánh giá · {review.content}</span></div>}
    </div>;
}

export default function OrderHistoryCard({ order, returnPath }: { order: Order; returnPath: string }) {
    const active = [OrderStatus.Pending, OrderStatus.Confirmed, OrderStatus.Prepared, OrderStatus.Shipping].includes(order.status);
    const [expanded, setExpanded] = useState(false);
    const multiple = order.orderItems.length > 1;
    const showItems = !multiple || expanded;
    const returning = [OrderStatus.ReturnRequested, OrderStatus.ReturnApproved, OrderStatus.Returned].includes(order.status);
    const badge = order.status === OrderStatus.Failed ? styles.badgeDanger : order.status === OrderStatus.Returned ? styles.badgeReturned : order.status === OrderStatus.Completed ? styles.badgeSuccess : [OrderStatus.Pending, OrderStatus.ReturnRequested].includes(order.status) ? styles.badgeWarning : styles.badgePrimary;
    const first = order.orderItems[0];
    const quantity = order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
    const formats = [...new Set(order.orderItems.map(item => purchaseType(item) === 'physical' ? 'Sách vật lý' : purchaseType(item) === 'rental' ? 'Thuê E-Book' : 'Mua E-Book'))].join(' · ');
    return <article className={styles.card}>
        <div className={styles.cardHeader}><div><strong>Đơn #{order.id}</strong><time dateTime={order.orderDate}>{new Date(order.orderDate).toLocaleDateString('vi-VN')}</time></div><span className={`${styles.badge} ${badge}`}>{orderStatusLabels[order.status]}</span></div>
        {active && <OrderProgress order={order} />}
        {/* Dropdown */}
        {multiple && !expanded && <div className={styles.productSummary}><div className={styles.coverStack}>{order.orderItems.slice(0, 2).map(item => <BookCover key={item.id} src={item.book?.coverImg} title={item.book?.title ?? 'Sách'} className={styles.summaryCover} />)}</div><div className={styles.summaryInfo}><strong>{first?.book?.title ?? 'Danh sách sản phẩm'} và {order.orderItems.length - 1} sản phẩm khác</strong><p>{quantity} cuốn · {formats}</p></div><button type="button" className={styles.expand} aria-expanded={false} onClick={() => setExpanded(true)}>Xem các sản phẩm ⌄</button></div>}
        {showItems && <>{multiple && <button type="button" className={styles.collapse} aria-expanded={true} onClick={() => setExpanded(false)}>Thu gọn sản phẩm ⌃</button>}{order.orderItems.map(item => <OrderHistoryItem key={item.id} order={order} item={item} />)}</>}
        {returning && <OrderProgress order={order} />}
        <OrderHistoryNotes order={order} />
        {!active && <div className={styles.paymentRow}><span>{order.paymentMethod === 'COD' ? 'Thanh toán tiền mặt COD' : order.paymentMethod ?? 'Chưa cập nhật phương thức thanh toán'}</span><OrderPoints order={order} /></div>}
        <div className={styles.cardFooter}><div className={styles.total}><span>Tổng tiền</span><strong>{order.finalAmount.toLocaleString('vi-VN')} đ</strong>{active && order.paymentMethod && <small>{order.paymentMethod === 'COD' ? 'Tiền mặt (COD) · Thanh toán khi nhận' : order.paymentMethod === 'SePay' ? 'SePay' : 'MoMo'}</small>}</div>
            {/* Chi Tiết */}
            {/* Hủy đơn */}
            {/* Hoàn trả */}
            <OrderHistoryActions order={order} detailPath={`/order-history/${order.id}`} returnPath={returnPath} allowReview={!showItems} />
        </div>
    </article>;
}

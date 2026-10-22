import { useNavigate } from 'react-router-dom';
import type { Order, OrderItem } from '../../../types/order';
import { OrderStatus } from '../../../types/order';
import { useOrderActionForm } from '../../../hooks/useOrderActionForm';
import { bookIdOf, canCancelOrder, canReturnOrder, canReviewOrder, purchaseLink, purchaseType, withinReturnWindow } from '../../../utils/orderHistory';
import OrderActionFields from './OrderActionFields';
import styles from './OrderHistoryInteractions.module.css';

export default function OrderHistoryActions({ order, item, detailPath, returnPath, allowReview = true }: { order: Order; item?: OrderItem; detailPath?: string; returnPath?: string; allowReview?: boolean }) {
    const form = useOrderActionForm(order, item);
    const navigate = useNavigate();
    const reviewed = (entry: OrderItem) => order.reviews?.some(value => value.itemId ? value.itemId === entry.id : value.bookId === bookIdOf(entry));
    const needsReview = item ? !reviewed(item) : order.orderItems.some(entry => !reviewed(entry));
    return <>
        <div className={styles.actions}>
            {!item && detailPath && <button type="button" className={styles.secondary} onClick={() => navigate(detailPath, { state: { returnPath } })}>Xem chi tiết</button>}
            {!item && canCancelOrder(order) && <button type="button" className={styles.danger} onClick={() => form.open('cancel')}>Hủy đơn</button>}
            {allowReview && canReviewOrder(order) && needsReview && <button type="button" className={styles.primary} onClick={() => form.open('review')}>Đánh giá</button>}
            {!item && canReturnOrder(order) && withinReturnWindow(order) && <button type="button" className={styles.danger} onClick={() => form.open('return')}>Hoàn hàng</button>}
            {item && order.status === OrderStatus.Completed && purchaseType(item) !== 'ebook' && bookIdOf(item) > 0 && <button type="button" className={styles.secondary} onClick={() => navigate(purchaseLink(item))}>{purchaseType(item) === 'rental' ? 'Gia hạn' : 'Mua lại'}</button>}
        </div>
        {form.mode && <OrderActionFields order={order} form={form} />}
    </>;
}

export function OrderHistoryNotes({ order }: { order: Order }) {
    return <div className={styles.notes}>
        {order.status === OrderStatus.Failed && <div className={styles.failure}><strong>Đơn hàng không thành công</strong><p>{order.failureReason ?? 'Đơn hàng không thực hiện thành công.'}</p></div>}
        {order.returnInfo?.outcome && <div className={order.returnInfo.outcome === 'rejected' ? styles.failure : styles.noticeWarning}><strong>{order.returnInfo.outcome === 'rejected' ? 'Yêu cầu hoàn hàng đã bị từ chối' : 'Hoàn trả không thực hiện được'}</strong>{order.returnInfo.outcomeReason && <p>{order.returnInfo.outcomeReason}</p>}</div>}
        {order.status === OrderStatus.Shipping && <div className={styles.noticeInfo}><strong>Shipper đang giao hàng cho bạn</strong><p>{order.paymentMethod === 'COD' && !order.isPaid ? `Vui lòng chuẩn bị ${order.finalAmount.toLocaleString('vi-VN')} đ tiền mặt khi nhận hàng.` : 'Vui lòng giữ liên lạc để nhận hàng từ shipper.'}</p></div>}
        {order.status === OrderStatus.ReturnRequested && <div className={styles.noticeWarning}><strong>Yêu cầu đang chờ nhân viên xét duyệt</strong><p>Bạn sẽ nhận thông báo khi có kết quả.</p></div>}
        {order.status === OrderStatus.ReturnApproved && <div className={styles.noticeInfo}><strong>Yêu cầu đã được duyệt</strong><p>Shipper sẽ đến lấy lại hàng, vui lòng giữ sách nguyên trạng.</p></div>}
        {order.status === OrderStatus.Returned && <div className={styles.noticeReturned}><strong>Hoàn trả thành công</strong><p>Đơn hàng đã được hoàn trả.</p></div>}
        {order.returnInfo && <section className={styles.evidence}><strong>Lý do &amp; bằng chứng hoàn hàng</strong><p>{order.returnInfo.reason}: {order.returnInfo.description}</p><div className={styles.attachments}>{order.returnInfo.imageUrls.map((image, index) => <a key={index} href={image} target="_blank" rel="noreferrer"><img src={image} alt={`Ảnh tình trạng sách ${index + 1}`} /></a>)}</div>{order.returnInfo.videoUrl && <video controls src={order.returnInfo.videoUrl} className={styles.video} />}</section>}
        {order.reviews?.some(review => review.isHidden || order.status === OrderStatus.Returned) && <div className={styles.hiddenReview}><strong>Đánh giá đã bị ẩn</strong><p>Đánh giá của đơn này không còn hiển thị do đơn hoàn trả.</p></div>}
    </div>;
}

import { useEffect, useRef } from 'react';
import { X, Star } from 'lucide-react';
import { lowRatingReasons, returnReasons, type useOrderActionForm } from '../../../hooks/useOrderActionForm';
import type { Order } from '../../../types/order';
import styles from './OrderHistoryInteractions.module.css';

export default function OrderActionFields({ order, form }: { order: Order; form: ReturnType<typeof useOrderActionForm> }) {
    const dialog = useRef<HTMLDialogElement>(null);
    useEffect(() => {
        const node = dialog.current;
        const previous = document.body.style.overflow;
        node?.showModal(); document.body.style.overflow = 'hidden';
        return () => { node?.close(); document.body.style.overflow = previous; };
    }, []);
    const readonly = form.mode === 'review' && !!form.review;
    const isReturn = form.mode === 'return';
    return <dialog className={styles.dialog} ref={dialog} aria-labelledby="order-action-title" onCancel={event => { event.preventDefault(); form.close(); }}>
        <header><div><h2 id="order-action-title">{form.mode === 'cancel' ? 'Hủy đơn hàng' : isReturn ? 'Yêu cầu hoàn hàng' : readonly ? 'Đánh giá của bạn' : 'Đánh giá sản phẩm'}</h2><p>Đơn hàng #{order.id}</p></div><button type="button" aria-label="Đóng" onClick={form.close}><X size={18} /></button></header>
        <form onSubmit={event => { event.preventDefault(); form.submit(); }}>
            {form.mode === 'cancel' ? <div className={styles.formBody}><p>Bạn có chắc chắn muốn hủy đơn hàng này?</p>{order.isPaid && <p>Đơn đã thanh toán sẽ được xử lý hoàn tiền theo phương thức thanh toán của đơn.</p>}</div> : <div className={styles.formBody}>
                {form.mode === 'review' && <>
                    <label>Sản phẩm<select value={form.itemId} onChange={event => form.selectItem(Number(event.target.value))}>{order.orderItems.filter(item => !order.reviews?.some(review => review.itemId ? review.itemId === item.id : review.bookId === item.bookId)).map(item => <option key={item.id} value={item.id}>{item.book?.title ?? `Sách #${item.bookId}`}</option>)}</select></label>
                    <div className={styles.stars} role="group" aria-label="Số sao đánh giá">{[1, 2, 3, 4, 5].map(star => <button type="button" key={star} aria-label={`${star} sao`} aria-pressed={form.rating === star} disabled={readonly} onClick={() => form.setRating(star)}><Star size={28} fill={star <= form.rating ? 'currentColor' : 'none'} /></button>)}</div>
                </>}
                {(isReturn || form.rating <= 2) && <label>Lý do *<select value={form.reason} disabled={readonly} required onChange={event => form.setReason(event.target.value)}><option value="">Chọn lý do</option>{(isReturn ? returnReasons : lowRatingReasons).map(reason => <option key={reason}>{reason}</option>)}</select></label>}
                <label>{isReturn ? 'Mô tả cụ thể *' : 'Nhận xét *'}<textarea rows={4} maxLength={isReturn ? 2000 : 4000} minLength={isReturn ? 10 : 1} required readOnly={readonly} value={form.description} onChange={event => form.setDescription(event.target.value)} placeholder={isReturn ? 'Mô tả tình trạng sách khi nhận hàng...' : 'Chia sẻ cảm nhận của bạn về sản phẩm...'} /></label>
                {isReturn && <><label>Ảnh hoặc video tình trạng sách *<input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" multiple disabled={form.reading} onChange={event => { void form.selectFiles(event.target.files); event.target.value = ''; }} /></label><p>Tối đa 6 ảnh và 1 video, mỗi file không quá 10 MB.</p><div className={styles.attachments}>{form.images.map((image, index) => <div key={index}><img src={image} alt={`Ảnh tình trạng sách ${index + 1}`} /><button type="button" aria-label={`Xóa ảnh ${index + 1}`} onClick={() => form.removeImage(index)}>×</button></div>)}</div>{form.video && <div><video controls src={form.video} className={styles.video} /><button type="button" className={styles.textButton} onClick={form.removeVideo}>Xóa video</button></div>}</>}
                {form.reading && <p role="status">Đang đọc file...</p>}
            </div>}
            {form.error && <p className={styles.error} role="alert">{form.error}</p>}
            <footer><button type="button" className={styles.secondary} onClick={form.close}>{readonly ? 'Đóng' : 'Để sau'}</button>{!readonly && <button type="submit" className={styles.primary} disabled={form.reading || isReturn && (!form.reason || form.description.trim().length < 10 || form.images.length === 0 && !form.video)}>{form.mode === 'cancel' ? 'Xác nhận hủy' : isReturn ? 'Gửi duyệt' : 'Gửi đánh giá'}</button>}</footer>
        </form>
    </dialog>;
}

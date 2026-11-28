import { AlertCircle, CheckCircle2, Clock3, Pencil, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMemberReviews } from '../../../hooks/useMemberReviews';
import { useUser } from '../../../context/UserContext';
import ToastNotification from '../../common/ToastNotification';
import ReviewEditorModal from '../member-reviews/ReviewEditorModal';
import { editable } from '../member-reviews/reviewUtils';
import styles from './BookReviewEntry.module.css';

interface BookReviewEntryProps {
    bookId: number;
    onReviewSaved?: () => void;
}

export default function BookReviewEntry({ bookId, onReviewSaved }: BookReviewEntryProps) {
    const { user, isLoggedIn } = useUser();
    if (!isLoggedIn || user?.role !== 'Member') return null;
    return <MemberBookReviewEntry bookId={bookId} onReviewSaved={onReviewSaved} />;
}

function MemberBookReviewEntry({ bookId, onReviewSaved }: BookReviewEntryProps) {
    const reviews = useMemberReviews(bookId);
    const notification = (
        <ToastNotification
            toasts={reviews.notifications.toasts}
            onClose={reviews.notifications.dismissToast}
        />
    );
    if (reviews.resource.loading) {
        return <>{notification}<p className={styles.loading} role="status">Đang kiểm tra quyền đánh giá...</p></>;
    }
    if (reviews.resource.error) {
        return <>{notification}<p className={styles.warning} role="alert"><AlertCircle size={15} />{reviews.resource.error}</p></>;
    }

    const data = reviews.resource.data;
    const eligibleOrder = data?.eligible.items.find((order) =>
        order.books.some((book) => book.bookId === bookId));
    const existingReview = data?.reviews.items.find((review) => review.bookId === bookId);
    const reviewOrder = eligibleOrder
        ? { ...eligibleOrder, books: eligibleOrder.books.filter((book) => book.bookId === bookId) }
        : undefined;

    const openCreate = () => {
        if (!reviewOrder) return;
        reviews.setError('');
        reviews.setEditor({ order: reviewOrder });
    };
    const openEdit = () => {
        if (!existingReview || !editable(existingReview)) return;
        reviews.setError('');
        reviews.setEditor({ review: existingReview });
    };

    return (
        <div className={styles.entry}>
            {notification}
            {reviewOrder ? (
                <div className={styles.eligible}>
                    <span><CheckCircle2 size={16} /> Giao dịch của bạn đã đủ điều kiện đánh giá.</span>
                    <button type="button" onClick={openCreate}>
                        <Star size={15} /> Đánh giá sản phẩm
                    </button>
                </div>
            ) : existingReview ? (
                <div className={styles.reviewed}>
                    <span>
                        <CheckCircle2 size={15} /> Bạn đã đánh giá cuốn sách này.
                        {editable(existingReview) && <small><Clock3 size={12} /> Có thể chỉnh sửa trong 30 ngày từ khi gửi.</small>}
                    </span>
                    {editable(existingReview) ? (
                        <button type="button" onClick={openEdit}><Pencil size={14} /> Cập nhật đánh giá</button>
                    ) : (
                        <Link to="/my-reviews">Xem đánh giá của tôi</Link>
                    )}
                </div>
            ) : (
                <p className={styles.warning}>
                    <AlertCircle size={16} />
                    Chỉ những khách hàng đã mua hoặc thuê cuốn sách này thành công mới có thể gửi đánh giá sản phẩm!
                </p>
            )}
            {reviews.editor && (
                <ReviewEditorModal
                    reviews={reviews}
                    editor={reviews.editor}
                    onSaved={onReviewSaved}
                />
            )}
        </div>
    );
}

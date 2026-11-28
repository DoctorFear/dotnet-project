import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    MessageSquareText,
    ShieldCheck,
    Star,
} from 'lucide-react';
import { useMemberReviews } from '../hooks/useMemberReviews';
import type { MemberReview, ReviewOrder } from '../types/workflow';
import BookPagination from '../components/common/BookPagination';
import ToastNotification from '../components/common/ToastNotification';
import PendingReviewList from '../components/features/member-reviews/PendingReviewList';
import ReviewedReviewList from '../components/features/member-reviews/ReviewedReviewList';
import ReviewEditorModal from '../components/features/member-reviews/ReviewEditorModal';
import DeleteReviewModal from '../components/features/member-reviews/DeleteReviewModal';
import {
    EmptyState,
    MemberShell,
    WorkflowError,
} from '../components/features/workflow/WorkflowShared';
import common from '../components/features/workflow/Workflow.module.css';
import styles from '../components/features/member-reviews/MemberReviews.module.css';

export default function MemberReviewsPage() {
    const [searchParams] = useSearchParams();
    const requestedBookIdValue = Number(searchParams.get('bookId'));
    const requestedBookId = Number.isSafeInteger(requestedBookIdValue) && requestedBookIdValue > 0
        ? requestedBookIdValue : undefined;
    const reviews = useMemberReviews(requestedBookId);
    const data = reviews.resource.data;
    const { setEditor, setError } = reviews;
    const openedRequestedBook = useRef<number | null>(null);

    useEffect(() => {
        if (!requestedBookId || reviews.resource.loading || openedRequestedBook.current === requestedBookId) return;
        const order = data?.eligible.items.find((item) =>
            item.books.some((book) => book.bookId === requestedBookId));
        if (order) {
            openedRequestedBook.current = requestedBookId;
            setError('');
            setEditor({ order });
        }
    }, [data?.eligible.items, requestedBookId, reviews.resource.loading, setEditor, setError]);

    const open = (order?: ReviewOrder, review?: MemberReview) => {
        reviews.setError('');
        reviews.setEditor({ order, review });
    };

    return (
        <MemberShell
            title="Đánh giá của tôi"
            subtitle="Chia sẻ trải nghiệm đọc sách và giúp những độc giả khác lựa chọn."
        >
            <ToastNotification
                toasts={reviews.notifications.toasts}
                onClose={reviews.notifications.dismissToast}
            />
            <section className={styles.intro}>
                <span className={styles.introIcon}>
                    <MessageSquareText size={28} />
                </span>
                <div>
                    <h2>Những đánh giá nhỏ, giá trị thật</h2>
                    <p>
                        Đánh giá từ giao dịch mua hoặc thuê hợp lệ để nhận F-Point. Mỗi đơn
                        hàng hoặc lượt thuê chỉ nhận thưởng đánh giá một lần.
                    </p>
                </div>
                <span className={styles.starsArt}>
                    <Star size={20} fill="currentColor" />
                    <Star size={27} fill="currentColor" />
                    <Star size={20} fill="currentColor" />
                </span>
            </section>
            <nav className={styles.tabs} aria-label="Đánh giá cá nhân">
                <button
                    type="button"
                    aria-pressed={reviews.tab === 'pending'}
                    onClick={() => reviews.setTab('pending')}
                >
                    Chờ đánh giá <span>{data?.eligible.totalCount ?? '—'}</span>
                </button>
                <button
                    type="button"
                    aria-pressed={reviews.tab === 'reviewed'}
                    onClick={() => reviews.setTab('reviewed')}
                >
                    Đã đánh giá <span>{data?.reviews.totalCount ?? '—'}</span>
                </button>
            </nav>
            {reviews.resource.error ? (
                <WorkflowError
                    message={reviews.resource.error}
                    retry={reviews.resource.reload}
                />
            ) : reviews.resource.loading ? (
                <p role="status" className={common.loading}>
                    Đang tải giao dịch và đánh giá...
                </p>
            ) : (
                <>
                    {reviews.tab === 'pending' ? (
                        data?.eligible.items.length ? (
                            <PendingReviewList
                                orders={data.eligible.items}
                                onOpen={(order) => open(order)}
                            />
                        ) : (
                            <EmptyState
                                title="Bạn đã xem hết các giao dịch cần đánh giá"
                                detail="Đơn sách giấy cần hoàn thành và thanh toán; lượt thuê cần thanh toán và kích hoạt quyền đọc."
                            />
                        )
                    ) : data?.reviews.items.length ? (
                        <ReviewedReviewList
                            items={data.reviews.items}
                            onEdit={(review) => open(undefined, review)}
                            onDelete={(review) => {
                                reviews.setError('');
                                reviews.setDeleting(review);
                            }}
                        />
                    ) : (
                        <EmptyState
                            title="Bạn chưa có đánh giá nào"
                            detail="Chọn tab Chờ đánh giá để chia sẻ cảm nhận về sách."
                        />
                    )}
                    {data && (
                        <BookPagination
                            page={reviews.page}
                            pageSize={10}
                            pageSizes={[10]}
                            totalCount={
                                reviews.tab === 'pending'
                                    ? data.eligible.totalCount
                                    : data.reviews.totalCount
                            }
                            onPageChange={reviews.setPage}
                            onPageSizeChange={() => {}}
                            itemLabel={reviews.tab === 'pending' ? 'giao dịch' : 'đánh giá'}
                        />
                    )}
                </>
            )}
            <div className={styles.note}>
                <ShieldCheck size={16} />
                <p>
                    Chỉ đánh giá từ giao dịch của chính bạn. Sửa đánh giá không nhận thêm
                    điểm; xóa rồi gửi lại cũng không được thưởng lần nữa.
                </p>
            </div>
            {reviews.editor && (
                <ReviewEditorModal reviews={reviews} editor={reviews.editor} />
            )}
            <DeleteReviewModal reviews={reviews} />
        </MemberShell>
    );
}

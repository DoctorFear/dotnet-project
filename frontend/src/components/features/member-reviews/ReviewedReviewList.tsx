import {
    BadgeCheck,
    Clock3,
    Pencil,
    Star,
    Trash2,
} from 'lucide-react';
import type { MemberReview } from '../../../types/workflow';
import { date } from '../workflow/WorkflowShared';
import common from '../workflow/Workflow.module.css';
import styles from './MemberReviews.module.css';
import { editable, parseImages } from './reviewUtils';

interface ReviewedReviewListProps {
    items: MemberReview[];
    onEdit: (review: MemberReview) => void;
    onDelete: (review: MemberReview) => void;
}

export default function ReviewedReviewList({
    items,
    onEdit,
    onDelete,
}: ReviewedReviewListProps) {
    return (
        <div className={styles.list}>
            {items.map((review) => (
                <article
                    key={review.id}
                    className={`${common.panel} ${styles.reviewCard}`}
                >
                    <div className={styles.reviewHeading}>
                        <div>
                            <h2>{review.bookTitle}</h2>
                            <span className={common.muted}>
                                {review.orderId ? `Đơn ORD-${review.orderId} · ` : ''}
                                {date(review.createdAt)}
                            </span>
                        </div>
                        <span className={`${common.badge} ${common.badgeGreen}`}>
                            <BadgeCheck size={12} />
                            {review.verificationLabel || 'Giao dịch đã xác thực'}
                        </span>
                    </div>
                    <div
                        className={styles.rating}
                        aria-label={`${review.rating} trên 5 sao`}
                    >
                        {[1, 2, 3, 4, 5].map((value) => (
                            <Star
                                key={value}
                                size={16}
                                fill={value <= review.rating ? 'currentColor' : 'none'}
                            />
                        ))}
                    </div>
                    {review.title && <h3>{review.title}</h3>}
                    <p className={styles.reviewContent}>{review.content}</p>
                    {parseImages(review.imageUrls).length > 0 && (
                        <div className={styles.images}>
                            {parseImages(review.imageUrls).map((url) => (
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    key={url}
                                >
                                    <img src={url} alt="Ảnh thực tế trong đánh giá" />
                                </a>
                            ))}
                        </div>
                    )}
                    <footer className={styles.reviewFooter}>
                        <span>
                            <Clock3 size={12} />
                            {editable(review)
                                ? 'Được chỉnh sửa trong 30 ngày kể từ khi gửi'
                                : 'Đã hết thời hạn chỉnh sửa'}
                        </span>
                        <div>
                            {editable(review) && (
                                <button type="button" onClick={() => onEdit(review)}>
                                    <Pencil size={13} />
                                    Chỉnh sửa
                                </button>
                            )}
                            <button type="button" onClick={() => onDelete(review)}>
                                <Trash2 size={13} />
                                Xóa
                            </button>
                        </div>
                    </footer>
                </article>
            ))}
        </div>
    );
}

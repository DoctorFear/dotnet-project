import {
    BadgeCheck,
    BookOpen,
    ChevronRight,
    Star,
} from 'lucide-react';
import type { ReviewOrder } from '../../../types/workflow';
import BookCover from '../../common/BookCover';
import { workflowDate } from '../../../utils/workflowPresentation';
import common from '../workflow/Workflow.module.css';
import styles from './MemberReviews.module.css';

interface PendingReviewListProps {
    orders: ReviewOrder[];
    onOpen: (order: ReviewOrder) => void;
}

export default function PendingReviewList({ orders, onOpen }: PendingReviewListProps) {
    return (
        <div className={styles.list}>
            {orders.map((order) => (
                <article className={common.panel} key={order.orderId}>
                    <div className={styles.cardHeading}>
                        <strong>
                            <BookOpen size={15} />
                            Đơn ORD-{order.orderId}
                        </strong>
                        <span>Ngày đặt: {workflowDate(order.orderDate)}</span>
                    </div>
                    <div className={styles.orderBooks}>
                        {order.books.map((book, index) => (
                            <div
                                className={common.bookRow}
                                key={`${book.bookId}-${index}`}
                            >
                                <BookCover
                                    src={book.coverImg ?? undefined}
                                    title={book.title}
                                    className={common.bookCover}
                                />
                                <div>
                                    <h3>{book.title}</h3>
                                    <span className={`${common.badge} ${common.badgeGreen}`}>
                                        <BadgeCheck size={12} />
                                        {book.purchaseType === 1 ? 'Đã mua sách' : 'Đã thuê sách'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <footer className={styles.cardFooter}>
                        <span>
                            {order.books.length > 1
                                ? 'Chọn một cuốn sách để đánh giá cho giao dịch này.'
                                : 'Giao dịch đã đủ điều kiện đánh giá.'}
                        </span>
                        <button
                            type="button"
                            className={common.primary}
                            onClick={() => onOpen(order)}
                        >
                            <Star size={15} />
                            Viết đánh giá
                            <ChevronRight size={14} />
                        </button>
                    </footer>
                </article>
            ))}
        </div>
    );
}

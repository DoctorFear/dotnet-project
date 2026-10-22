import { useEffect } from 'react';
import { BadgeCheck } from 'lucide-react';
import { getReviewImages, useBookReviews } from '../../../hooks/useBookReviews';
import BookPagination from '../../common/BookPagination';
import StarRating from '../../common/StarRating';
import styles from './BookReviews.module.css';

export default function BookReviews({ bookId, onCountChange }: { bookId: number; onCountChange?: (bookId: number, count: number) => void }) {
    const reviews = useBookReviews(bookId);
    useEffect(() => {
        if (!reviews.isLoading && !reviews.error) onCountChange?.(bookId, reviews.totalCount);
    }, [bookId, onCountChange, reviews.isLoading, reviews.error, reviews.totalCount]);
    if (reviews.isLoading) return <p>Đang tải đánh giá...</p>;
    if (reviews.error) return <p role="alert">{reviews.error}</p>;
    return <div>{reviews.items.length === 0 && <p>Chưa có đánh giá cho sách này.</p>}
        {reviews.items.map(review => <article key={review.id} className={styles.review}>
            <div className={styles.reviewHeader}><strong>{review.userFullName || 'Độc giả'}</strong>{review.verificationLabel && <span className={styles.verified}><BadgeCheck size={14} />{review.verificationLabel}</span>}</div>
            <div className={styles.ratingRow}><StarRating rating={review.rating} /></div>
            {review.title && <h4>{review.title}</h4>}<p>{review.content}</p>
            <div className={styles.images}>{getReviewImages(review.imageUrls).map(url => <a key={url} href={url} target="_blank" rel="noreferrer"><img src={url} alt="Ảnh đánh giá" /></a>)}</div>
        </article>)}
        {reviews.totalCount > 5 && <BookPagination page={reviews.page} pageSize={5} totalCount={reviews.totalCount} onPageChange={reviews.setPage} onPageSizeChange={() => {}} pageSizes={[5]} />}
    </div>;
}

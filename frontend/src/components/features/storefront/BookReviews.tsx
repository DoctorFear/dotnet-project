import { getReviewImages, useBookReviews } from '../../../hooks/useBookReviews';
import BookPagination from '../../common/BookPagination';
import StarRating from '../../common/StarRating';
import styles from './BookReviews.module.css';

export default function BookReviews({ bookId }: { bookId: number }) {
    const reviews = useBookReviews(bookId);
    if (reviews.isLoading) return <p>Đang tải đánh giá...</p>;
    if (reviews.error) return <p role="alert">{reviews.error}</p>;
    return <div>{reviews.items.length === 0 && <p>Chưa có đánh giá cho sách này.</p>}
        {reviews.items.map(review => <article key={review.id} className={styles.review}>
            <strong>{review.userFullName || 'Độc giả'}</strong><StarRating rating={review.rating} />
            {review.verificationLabel && <small>{review.verificationLabel}</small>}
            {review.title && <h4>{review.title}</h4>}<p>{review.content}</p>
            <div className={styles.images}>{getReviewImages(review.imageUrls).map(url => <a key={url} href={url} target="_blank" rel="noreferrer"><img src={url} alt="Ảnh đánh giá" /></a>)}</div>
        </article>)}
        {reviews.totalCount > 5 && <BookPagination page={reviews.page} pageSize={5} totalCount={reviews.totalCount} onPageChange={reviews.setPage} onPageSizeChange={() => {}} pageSizes={[5]} />}
    </div>;
}

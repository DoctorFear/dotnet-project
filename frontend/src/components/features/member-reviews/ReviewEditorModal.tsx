import { useEffect, useState } from 'react';
import {
    BookOpen,
    ImagePlus,
    Star,
    X,
} from 'lucide-react';
import { useMemberReviews } from '../../../hooks/useMemberReviews';
import { WorkflowError, WorkflowModal } from '../workflow/WorkflowShared';
import common from '../workflow/Workflow.module.css';
import styles from './MemberReviews.module.css';
import { parseImages } from './reviewUtils';

type Reviews = ReturnType<typeof useMemberReviews>;

export default function ReviewEditorModal({ reviews }: { reviews: Reviews }) {
    const [rating, setRating] = useState(0);
    const [bookId, setBookId] = useState(0);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const order = reviews.editor?.order;
        const review = reviews.editor?.review;
        setBookId(review?.bookId ?? order?.books[0].bookId ?? 0);
        setRating(review?.rating ?? 0);
        setTitle(review?.title ?? '');
        setContent(review?.content ?? '');
        setImages(parseImages(review?.imageUrls ?? null));
    }, [reviews.editor]);

    const upload = async (files: FileList | null) => {
        if (!files?.length) return;
        const selected = Array.from(files);
        if (
            images.length + selected.length > 6 ||
            selected.some(
                (file) =>
                    !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
                    file.size > 5 * 1024 * 1024 ||
                    !file.size,
            )
        ) {
            reviews.setError(
                'Chọn tối đa 6 ảnh JPG, PNG hoặc WebP, mỗi ảnh không quá 5 MB.',
            );
            return;
        }
        setUploading(true);
        reviews.setError('');
        try {
            const results = await Promise.all(
                selected.map((file) => reviews.api.uploadReviewImage(file)),
            );
            const updated = [...images, ...results.map((value) => value.fileUrl)];
            if (JSON.stringify(updated).length > 2000)
                throw new Error(
                    'Các liên kết ảnh vượt độ dài cho phép. Vui lòng chọn ít ảnh hơn.',
                );
            setImages(updated);
        } catch (cause) {
            reviews.setError(
                cause instanceof Error ? cause.message : 'Không thể tải ảnh lên.',
            );
        } finally {
            setUploading(false);
        }
    };

    if (!reviews.editor) return null;

    return (
        <WorkflowModal
            title={reviews.editor.review ? 'Chỉnh sửa đánh giá' : 'Đánh giá cuốn sách'}
            busy={reviews.busy || uploading}
            onClose={() => reviews.setEditor(null)}
        >
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    void reviews.save({
                        orderId:
                            reviews.editor?.order?.orderId ??
                            reviews.editor?.review?.orderId ??
                            undefined,
                        bookId,
                        rating,
                        title: title.trim(),
                        content: content.trim(),
                        imageUrls: JSON.stringify(images),
                    });
                }}
            >
                <div className={common.dialogBody}>
                    {reviews.editor.order && reviews.editor.order.books.length > 1 ? (
                        <label className={common.field}>
                            Chọn sách trong đơn
                            <select
                                value={bookId}
                                onChange={(event) => setBookId(Number(event.target.value))}
                            >
                                {reviews.editor.order.books.map((book, index) => (
                                    <option
                                        value={book.bookId}
                                        key={`${book.bookId}-${index}`}
                                    >
                                        {book.title}
                                    </option>
                                ))}
                            </select>
                        </label>
                    ) : (
                        <p className={styles.editBook}>
                            <BookOpen size={20} />
                            {reviews.editor.review?.bookTitle ??
                                reviews.editor.order?.books[0].title}
                        </p>
                    )}
                    <div className={styles.ratingPicker}>
                        <p>Bạn cảm nhận thế nào về cuốn sách?</p>
                        <div>
                            {[1, 2, 3, 4, 5].map((value) => (
                                <button
                                    type="button"
                                    key={value}
                                    aria-label={`Đánh giá ${value} sao`}
                                    aria-pressed={rating === value}
                                    onClick={() => setRating(value)}
                                >
                                    <Star
                                        size={32}
                                        fill={value <= rating ? 'currentColor' : 'none'}
                                    />
                                </button>
                            ))}
                        </div>
                        <small>
                            {
                                [
                                    'Chọn số sao để đánh giá',
                                    'Rất không hài lòng',
                                    'Chưa hài lòng',
                                    'Bình thường',
                                    'Hài lòng',
                                    'Rất hài lòng',
                                ][rating]
                            }
                        </small>
                    </div>
                    <label className={common.field}>
                        Tiêu đề (không bắt buộc)
                        <input
                            maxLength={200}
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder="Một câu ngắn về trải nghiệm của bạn"
                        />
                    </label>
                    <label className={common.field}>
                        Nhận xét của bạn
                        <textarea
                            required
                            rows={4}
                            maxLength={4000}
                            value={content}
                            onChange={(event) => setContent(event.target.value)}
                            placeholder="Chia sẻ về nội dung, chất lượng sách và trải nghiệm đọc..."
                        />
                        <small>{content.length}/4.000 ký tự</small>
                    </label>
                    <div className={styles.upload}>
                        <label>
                            <ImagePlus size={19} />
                            {uploading ? 'Đang tải ảnh...' : 'Thêm ảnh thực tế'}
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                multiple
                                disabled={uploading || reviews.busy || images.length >= 6}
                                onChange={(event) => {
                                    void upload(event.target.files);
                                    event.target.value = '';
                                }}
                            />
                        </label>
                        <small>JPG, PNG, WebP · Tối đa 6 ảnh, 5 MB/ảnh</small>
                    </div>
                    {images.length > 0 && (
                        <div className={styles.images}>
                            {images.map((url, index) => (
                                <div key={`${url}-${index}`}>
                                    <img src={url} alt={`Ảnh đánh giá ${index + 1}`} />
                                    <button
                                        type="button"
                                        disabled={uploading || reviews.busy}
                                        aria-label={`Bỏ ảnh ${index + 1}`}
                                        onClick={() =>
                                            setImages(images.filter((_, i) => i !== index))
                                        }
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    {reviews.error && <WorkflowError message={reviews.error} />}
                </div>
                <footer className={common.dialogFooter}>
                    <button
                        type="button"
                        className={common.secondary}
                        disabled={reviews.busy || uploading}
                        onClick={() => reviews.setEditor(null)}
                    >
                        Để sau
                    </button>
                    <button
                        type="submit"
                        className={common.primary}
                        disabled={!rating || !content.trim() || reviews.busy || uploading}
                    >
                        {reviews.busy
                            ? 'Đang gửi...'
                            : reviews.editor.review
                                ? 'Lưu thay đổi'
                                : 'Gửi đánh giá'}
                    </button>
                </footer>
            </form>
        </WorkflowModal>
    );
}

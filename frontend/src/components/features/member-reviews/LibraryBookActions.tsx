import styles from './LibraryBookActions.module.css';

interface LibraryBookActionsProps {
    isExpired: boolean;
    isRented: boolean;
    onRead: () => void;
    onRenew: () => void;
    onReview: () => void;
}

export function LibraryBookActions({
    isExpired,
    isRented,
    onRead,
    onRenew,
    onReview,
}: LibraryBookActionsProps) {
    return (
        <div className={styles.actions}>
            {!isExpired ? (
                <button type="button" className={styles.primary} onClick={onRead}>
                    Đọc Sách Online
                </button>
            ) : (
                <button type="button" className={styles.secondary} onClick={onRenew}>
                    Gia Hạn Gói Thuê
                </button>
            )}
            {isRented && (
                <button type="button" className={styles.review} onClick={onReview}>
                    Đánh giá sản phẩm
                </button>
            )}
        </div>
    );
}

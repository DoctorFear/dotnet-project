import { AlertTriangle, PackageX } from 'lucide-react';
import type { BookData } from '../../types/book';
import styles from './StockAvailabilityBadge.module.css';

export default function StockAvailabilityBadge({ book }: { book: Pick<BookData, 'isPhysicalAvailable' | 'stockCount' | 'stockStatus'> }) {
    if (!book.isPhysicalAvailable) return null;
    if (book.stockCount <= 0) return <span className={`${styles.badge} ${styles.empty}`}><PackageX size={13} />Hết sách giấy</span>;
    if (book.stockStatus === 'low_stock') return <span className={`${styles.badge} ${styles.warning}`}><AlertTriangle size={13} />Chỉ còn {book.stockCount} cuốn</span>;
    return <span className={`${styles.badge} ${styles.available}`}>Còn sách giấy</span>;
}

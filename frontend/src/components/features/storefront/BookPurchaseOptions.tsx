import { BookOpen, Clock, Monitor } from 'lucide-react';
import QuantitySelector from '../../common/QuantitySelector';
import type { PurchasableBook } from '../../../types/bookPurchase';
import type { useBookPurchaseSelection } from '../../../hooks/useBookPurchaseSelection';
import styles from './BookPurchaseOptions.module.css';

interface BookPurchaseOptionsProps {
    book: PurchasableBook;
    selection: ReturnType<typeof useBookPurchaseSelection>;
    disabled?: boolean;
}

export default function BookPurchaseOptions({ book, selection, disabled = false }: BookPurchaseOptionsProps) {
    const options = [
        { value: 'physical' as const, label: 'Sách Giấy', icon: BookOpen, price: book.physicalPrice ?? 0 },
        { value: 'ebook' as const, label: 'E-Book Online', icon: Monitor, price: book.eBookPrice ?? 0 },
        { value: 'rental' as const, label: 'Thuê Đọc', icon: Clock, price: Math.min(...selection.rentals.map((option) => option.price)) },
    ].filter((option) => selection.formats.includes(option.value));
    return (
        <div className={styles.selection}>
            <fieldset className={styles.group} disabled={disabled}>
                <legend>Lựa chọn hình thức sở hữu:</legend>
                <div className={styles.options}>
                    {options.map((option) => <label key={option.value} className={`${styles.option} ${selection.format === option.value ? styles.active : ''}`}>
                        <input type="radio" name={`format-${book.id}`} checked={selection.format === option.value} onChange={() => selection.setFormat(option.value)} />
                        <span><span className={styles.title}><option.icon size={15} />{option.label}</span><strong>{option.value === 'rental' ? 'Từ ' : ''}{Number.isFinite(option.price) ? option.price.toLocaleString('vi-VN') : '0'} đ</strong></span>
                    </label>)}
                </div>
            </fieldset>
            {selection.format === 'rental' && <fieldset className={styles.group} disabled={disabled}>
                <legend>Chọn thời hạn thuê online:</legend>
                <div className={styles.durations}>
                    {selection.rentals.map((option) => <label key={option.value} className={`${styles.option} ${selection.duration === option.value ? styles.active : ''}`}>
                        <input type="radio" name={`duration-${book.id}`} checked={selection.duration === option.value} onChange={() => selection.setDuration(option.value)} />
                        <span>{option.label}<strong>{option.price.toLocaleString('vi-VN')} đ</strong></span>
                    </label>)}
                </div>
                {selection.rentals.length === 0 && <span>Chưa có gói thuê khả dụng.</span>}
            </fieldset>}
            {selection.format === 'physical' && <div className={styles.quantity}>
                <span>Số lượng mua:</span>
                <QuantitySelector value={selection.quantity} onChange={selection.setQuantity} max={book.stockCount ?? 0} />
                {(book.stockCount ?? 0) === 0 && <span className={styles.warning}>Sách giấy đang hết hàng.</span>}
            </div>}
        </div>
    );
}

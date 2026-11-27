import { useState } from 'react';
import type { BookPurchaseFormat, BookRentalDuration, PurchasableBook } from '../types/bookPurchase';

// Quản lý trạng thái lựa chọn hình thức mua sách, ưu tiên các hình thức còn khả dụng
export const useBookPurchaseSelection = (book?: PurchasableBook | null, initialFormat: BookPurchaseFormat = 'physical') => {
    const isPhysicalActive = Boolean(book?.isPhysicalAvailable) && (book?.stockCount ?? 0) > 0;
    const hasPublishedEbook = Boolean(book?.hasPublishedEbook);

    const rentals: { value: BookRentalDuration; label: string; price: number }[] = [
        { value: 'week', label: '1 Tuần', price: book?.weeklyRentalPrice ?? 0 },
        { value: 'month', label: '1 Tháng', price: book?.monthlyRentalPrice ?? 0 },
        { value: 'year', label: '1 Năm', price: book?.yearlyRentalPrice ?? 0 },
    ].filter((option) => option.price > 0) as { value: BookRentalDuration; label: string; price: number }[];

    const isEBookActive = Boolean(book?.isEBookAvailable) && hasPublishedEbook;
    const isRentalActive = Boolean(book?.isRentalAvailable) && hasPublishedEbook && rentals.length > 0;

    const formats: BookPurchaseFormat[] = [];
    if (book?.isPhysicalAvailable) formats.push('physical');
    if (book?.isEBookAvailable) formats.push('ebook');
    if (book?.isRentalAvailable) formats.push('rental');

    const isFormatAvailable = (target: BookPurchaseFormat) => {
        if (target === 'physical') return isPhysicalActive;
        if (target === 'ebook') return isEBookActive;
        return isRentalActive;
    };

    const defaultAvailableFormat: BookPurchaseFormat = isPhysicalActive
        ? 'physical'
        : isEBookActive
        ? 'ebook'
        : isRentalActive
        ? 'rental'
        : (formats[0] ?? 'physical');

    const effectiveInitial = isFormatAvailable(initialFormat) ? initialFormat : defaultAvailableFormat;

    const [selectedFormat, setFormat] = useState<BookPurchaseFormat>(effectiveInitial);
    const [selectedDuration, setDuration] = useState<BookRentalDuration>('week');
    const [quantity, setQuantity] = useState(1);

    const format = formats.includes(selectedFormat) && isFormatAvailable(selectedFormat)
        ? selectedFormat
        : defaultAvailableFormat;

    const duration = rentals.some((option) => option.value === selectedDuration) ? selectedDuration : rentals[0]?.value ?? 'week';
    const price = format === 'physical' ? book?.physicalPrice ?? 0 : format === 'ebook' ? book?.eBookPrice ?? 0 : rentals.find((option) => option.value === duration)?.price ?? 0;
    const isCurrentFormatAvailable = isFormatAvailable(format);
    return { format, duration, quantity, price, formats, rentals, isCurrentFormatAvailable, setFormat, setDuration, setQuantity };
};

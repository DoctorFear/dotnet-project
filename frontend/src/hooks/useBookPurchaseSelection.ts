import { useState } from 'react';
import type { BookPurchaseFormat, BookRentalDuration, PurchasableBook } from '../types/bookPurchase';

export const useBookPurchaseSelection = (book?: PurchasableBook | null) => {
    const [selectedFormat, setFormat] = useState<BookPurchaseFormat>('physical');
    const [selectedDuration, setDuration] = useState<BookRentalDuration>('week');
    const [quantity, setQuantity] = useState(1);
    const formats: BookPurchaseFormat[] = [];
    if (book?.isPhysicalAvailable) formats.push('physical');
    if (book?.isEBookAvailable) formats.push('ebook');
    if (book?.isRentalAvailable) formats.push('rental');
    const format = formats.includes(selectedFormat) ? selectedFormat : formats[0] ?? 'physical';
    const rentals: { value: BookRentalDuration; label: string; price: number }[] = [
        { value: 'week', label: '1 Tuần', price: book?.weeklyRentalPrice ?? 0 },
        { value: 'month', label: '1 Tháng', price: book?.monthlyRentalPrice ?? 0 },
        { value: 'year', label: '1 Năm', price: book?.yearlyRentalPrice ?? 0 },
    ].filter((option) => option.price > 0) as { value: BookRentalDuration; label: string; price: number }[];
    const duration = rentals.some((option) => option.value === selectedDuration) ? selectedDuration : rentals[0]?.value ?? 'week';
    const price = format === 'physical' ? book?.physicalPrice ?? 0 : format === 'ebook' ? book?.eBookPrice ?? 0 : rentals.find((option) => option.value === duration)?.price ?? 0;
    return { format, duration, quantity, price, formats, rentals, setFormat, setDuration, setQuantity };
};

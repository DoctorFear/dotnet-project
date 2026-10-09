import { useRef, useState } from 'react';
import { addBookToCart } from '../services/bookCartService';
import type { BookPurchaseSelection, PurchasableBook } from '../types/bookPurchase';
import type { ToastMessage } from '../components/common/ToastNotification';

export const useBookCartAction = (notify: (message: string, type?: ToastMessage['type']) => void) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const pending = useRef(false);
    const submitPurchase = async (book: PurchasableBook, selection: BookPurchaseSelection) => {
        if (pending.current) return false;
        pending.current = true;
        setIsSubmitting(true);
        try {
            await addBookToCart(book, selection);
            notify(`Đã thêm ${book.title} vào giỏ hàng.`, 'success');
            return true;
        } catch (error) {
            notify(error instanceof Error ? error.message : 'Không thể thêm sách vào giỏ hàng.', 'error');
            return false;
        } finally {
            pending.current = false;
            setIsSubmitting(false);
        }
    };
    return { isSubmitting, submitPurchase };
};

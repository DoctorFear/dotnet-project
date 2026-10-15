import { useCallback, useEffect, useRef, useState } from 'react';
import { addBookToCart, deleteItemsCart, getCart, updateCart } from '../services/bookCartService';
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

export const useCartData = () => {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const loadCart = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getCart();
            
            const mappedItems = data.items.map((item: any) => ({
                ...item,
            }));
            
            setItems(mappedItems);
            console.log(mappedItems)
        } catch (err: any) {
            setError(err.message || 'Đã xảy ra lỗi khi tải giỏ hàng.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCart();
    }, [loadCart]);

    const updateItemQty = async (cartItemId: number, newQuantity: number, purchaseType: number, rentalDuration?: number | null, isSelected?: Boolean) => {
        try {
            await updateCart(cartItemId, { quantity: newQuantity, purchaseType, rentalDuration, isSelected });
            await loadCart();
        } catch (err: any) {
            setError(err.message || 'Lỗi khi cập nhật số lượng.');
            throw err;
        }
    };

    const removeCartItem = async (cartItemId: number) => {
        try {
            await deleteItemsCart(cartItemId);
            await loadCart();
        } catch (err: any) {
            setError(err.message || 'Lỗi khi xóa sản phẩm.');
            throw err;
        }
    };

    return {
        items,
        setItems,
        loading,
        error,
        reloadCart: loadCart,
        updateItemQty,
        removeCartItem
    };
};
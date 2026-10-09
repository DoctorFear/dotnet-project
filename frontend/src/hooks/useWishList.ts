import { useState } from 'react';
import type { ProductData } from '../types/book';
import { useToastNotifications } from './useToastNotifications';

export const useWishlist = (initialItems: ProductData[] = []) => {
    const [wishlistItems, setWishlistItems] = useState<ProductData[]>(initialItems);
    const { toasts, notify, dismissToast } = useToastNotifications();

    const removeWishlistItem = (id: number) => {
        const product = wishlistItems.find((item) => item.id === id);
        if (!product) return;
        setWishlistItems((prev) => prev.filter((item) => item.id !== id));
        notify(`Đã xóa ${product.title} khỏi danh sách yêu thích.`, 'success');
    };

    const addWishlistItem = (product: ProductData) => {
        if (wishlistItems.some((item) => item.id === product.id)) {
            notify(`${product.title} đã có trong danh sách yêu thích.`, 'info');
            return;
        }
        setWishlistItems((prev) => {
            if (prev.some((item) => item.id === product.id)) return prev;
            return [...prev, { ...product, isWishlisted: true }];
        });
        notify(`Đã thêm ${product.title} vào danh sách yêu thích.`, 'success');
    };

    return {
        wishlistItems,
        wishlistCount: wishlistItems.length,
        removeWishlistItem,
        addWishlistItem,
        toasts,
        dismissToast,
    };
};

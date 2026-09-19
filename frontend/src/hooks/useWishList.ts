import { useState } from 'react';
import type { ProductData } from '../types/product';

export const useWishlist = (initialItems: ProductData[] = []) => {
    const [wishlistItems, setWishlistItems] = useState<ProductData[]>(initialItems);

    const removeWishlistItem = (id: string) => {
        setWishlistItems((prev) => prev.filter((item) => item.id !== id));
    };

    const addWishlistItem = (product: ProductData) => {
        setWishlistItems((prev) => {
            if (prev.some((item) => item.id === product.id)) return prev;
            return [...prev, { ...product, isWishlisted: true }];
        });
    };

    return {
        wishlistItems,
        wishlistCount: wishlistItems.length,
        removeWishlistItem,
        addWishlistItem,
    };
};
import type { BookDetailData } from '../types/book';
import { requestApi } from './apiClient';

export const getWishlist = () => requestApi<BookDetailData[]>('/wishlist');
export const saveWishlistBook = (id: number) => requestApi<void>(`/wishlist/${id}`, { method: 'PUT' });
export const deleteWishlistBook = (id: number) => requestApi<void>(`/wishlist/${id}`, { method: 'DELETE' });

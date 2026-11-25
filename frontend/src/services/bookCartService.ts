import type { BookPurchaseSelection, PurchasableBook } from '../types/bookPurchase';
import { requestApi } from './apiClient';

// Lấy danh tính đăng nhập để gửi đúng hợp đồng API giỏ hàng
const getCurrentUserId = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) throw new Error('Vui lòng đăng nhập để thêm sách vào giỏ hàng.');
    try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        const userId = Number(payload.nameid ?? payload.sub ?? payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']);
        if (!Number.isInteger(userId) || userId <= 0 || !payload.exp || payload.exp * 1000 <= Date.now()) throw new Error();
        return userId;
    } catch {
        throw new Error('Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.');
    }
};

// Thêm sách vào giỏ hàng hỗ trợ cả 3 hình thức: Sách giấy (1), Thuê đọc (2), Mua E-Book (3)
export const addBookToCart = (book: PurchasableBook, selection: BookPurchaseSelection) => {
    if (selection.format === 'ebook' && (!book.isEBookAvailable || !book.hasPublishedEbook)) throw new Error('Sách chưa có ấn bản E-Book đã xuất bản.');
    if (selection.format === 'physical' && !book.isPhysicalAvailable) throw new Error('Sách không có phiên bản vật lý.');
    if (selection.format === 'rental' && (!book.isRentalAvailable || !book.isEBookAvailable || !book.hasPublishedEbook)) throw new Error('Sách chưa có ấn bản E-Book để thuê đọc.');
    if (selection.format === 'physical' && (book.stockCount ?? 0) < selection.quantity) throw new Error('Số lượng sách tồn kho không đủ.');
    return requestApi<{ message: string }>('/cart/items', {
        method: 'POST',
        body: JSON.stringify({
            userId: getCurrentUserId(),
            bookId: book.id,
            quantity: selection.format === 'physical' ? selection.quantity : 1,
            purchaseType: selection.format === 'physical' ? 1 : selection.format === 'rental' ? 2 : 3,
            rentalDuration: selection.format === 'rental' ? { week: 1, month: 2, year: 3 }[selection.duration] : null,
        }),
    });
};

export const getCart = async (): Promise<any> => {
    const userId = getCurrentUserId();
    return requestApi<any>(`/cart/${userId}`);
};

export const updateCart = async (
    cartItemId: number,
    data: { quantity: number; purchaseType: number; rentalDuration?: number | null, isSelected?: Boolean }
): Promise<{ message: string }> => {
    const userId = getCurrentUserId();
    return requestApi<{ message: string }>(`/cart/items/${cartItemId}?userId=${userId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
};

export const deleteItemsCart = async (cartItemId: number): Promise<{ message: string }> => {
    const userId = getCurrentUserId();
    return requestApi<{ message: string }>(`/cart/items/${cartItemId}?userId=${userId}`, {
        method: 'DELETE',
    });
};

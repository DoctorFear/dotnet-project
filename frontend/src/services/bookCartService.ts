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

export const addBookToCart = (book: PurchasableBook, selection: BookPurchaseSelection) => {
    if (selection.format === 'ebook') throw new Error('Giỏ hàng hiện chưa hỗ trợ mua E-book vĩnh viễn.');
    if (selection.format === 'physical' && !book.isPhysicalAvailable) throw new Error('Sách không có phiên bản vật lý.');
    if (selection.format === 'rental' && !book.isRentalAvailable) throw new Error('Sách không hỗ trợ thuê đọc.');
    if (selection.format === 'physical' && (book.stockCount ?? 0) < selection.quantity) throw new Error('Số lượng sách tồn kho không đủ.');
    return requestApi<{ message: string }>('/cart/items', {
        method: 'POST',
        body: JSON.stringify({
            userId: getCurrentUserId(),
            bookId: book.id,
            quantity: selection.format === 'physical' ? selection.quantity : 1,
            purchaseType: selection.format === 'physical' ? 1 : 2,
            rentalDuration: selection.format === 'rental' ? { week: 1, month: 2, year: 3 }[selection.duration] : null,
        }),
    });
};

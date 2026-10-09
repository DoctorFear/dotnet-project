import type { AdminBookData, BookData, BookDetailData, BookFilterParams, PagedResult, ProductData, SaveBookRequest } from '../types/book';
import { requestApi } from './apiClient';

// Hàm hỗ trợ ánh xạ dữ liệu từ AdminBookData sang ProductData cho Khách hàng
export const mapBookToProduct = (book: AdminBookData, publisherName?: string, categoryNames?: string[]): ProductData => ({
    ...book,
    publisher: publisherName ?? book.publisher,
    categories: categoryNames ?? book.categories,
});

const toQueryString = (filters: BookFilterParams) => {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) return;
        if (Array.isArray(value)) {
            value.forEach((item) => query.append(key, String(item)));
            return;
        }
        query.set(key, String(value));
    });
    return query.toString();
};

export const getBooks = (filters: BookFilterParams = {}) => {
    const query = toQueryString(filters);
    return requestApi<PagedResult<BookData>>(`/Book${query ? `?${query}` : ''}`);
};

export const getBookById = (id: number) => requestApi<BookDetailData>(`/Book/${id}`);

export const createBook = (data: SaveBookRequest) => requestApi<BookDetailData>('/Book', {
    method: 'POST',
    body: JSON.stringify(data),
});

export const updateBook = (id: number, data: SaveBookRequest) => requestApi<BookDetailData>(`/Book/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
});

export const deleteBook = (id: number) => requestApi<{ message: string }>(`/Book/${id}`, { method: 'DELETE' });

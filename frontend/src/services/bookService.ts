import type { AdminBookData, BookEditionUpload, BookReviewData, BookData, BookDetailData, BookFilterParams, PagedResult, ProductData, SaveBookRequest } from '../types/book';
import { requestApi } from './apiClient';

// Ánh xạ thông tin sách và tên nhà xuất bản, thể loại cho giao diện khách hàng.
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
export const getPublicationYears = () => requestApi<number[]>('/Book/publication-years');

export const createBook = (data: SaveBookRequest) => requestApi<BookDetailData>('/Book', {
    method: 'POST',
    body: JSON.stringify(data),
});

export const updateBook = (id: number, data: SaveBookRequest) => requestApi<BookDetailData>(`/Book/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
});

export const deleteBook = (id: number) => requestApi<{ message: string }>(`/Book/${id}`, { method: 'DELETE' });

export const updateBookStatus = (id: number, status: BookData['status']) => requestApi<{ message: string }>(`/Book/${id}/status`, { method: 'PATCH', body: JSON.stringify(status) });

export const uploadBookImage = async (file: File) => {
    if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 10 * 1024 * 1024)
        throw new Error('Ảnh phải là JPG/PNG và không lớn hơn 10 MB.');
    const body = new FormData();
    body.append('file', file);
    return requestApi<{ fileUrl: string }>('/Book/upload-file?folder=books', { method: 'POST', body });
};

export const uploadBookEdition = (bookId: number, file: File) => {
    if (!/\.(pdf|epub)$/i.test(file.name) || file.size > 100 * 1024 * 1024)
        throw new Error('Chỉ hỗ trợ PDF/EPUB, tối đa 100 MB.');
    const body = new FormData();
    body.append('bookId', String(bookId)); body.append('file', file);
    return requestApi<BookEditionUpload>('/EbookEditions/upload', { method: 'POST', body });
};
export const publishBookEdition = (editionId: number, presetType: number) => requestApi<{ message: string }>('/EbookEditions/' + editionId + '/publish', { method: 'POST', body: JSON.stringify({ presetType }) });

export const getBookReviews = (id: number, page: number) => requestApi<PagedResult<BookReviewData>>(`/Reviews/book/${id}?pageNumber=${page}&pageSize=5`);

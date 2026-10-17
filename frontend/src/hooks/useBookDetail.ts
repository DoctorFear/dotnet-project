import { useEffect, useState } from 'react';
import { getBookById, getBooks } from '../services/bookService';
import type { BookDetailData, ProductData } from '../types/book';
import { useStockPolicyRefresh } from './useStockPolicyRefresh';


export const useBookDetail = (bookId?: string) => {
    const stockPolicyVersion = useStockPolicyRefresh();
    const [book, setBook] = useState<BookDetailData | null>(null);
    const [relatedBooks, setRelatedBooks] = useState<ProductData[]>([]);
    const [sameAuthorBooks, setSameAuthorBooks] = useState<ProductData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const id = Number(bookId);
        if (!Number.isInteger(id) || id < 1) {
            void Promise.resolve().then(() => {
                setBook(null);
                setError('Mã sách không hợp lệ.');
                setIsLoading(false);
            });
            return;
        }

        let isMounted = true;
        void Promise.resolve().then(() => {
            if (isMounted) {
                setIsLoading(true);
                setBook(null);
                setRelatedBooks([]);
                setSameAuthorBooks([]);
                setError('');
            }
        });

        getBookById(id)
            .then(async (detail) => {
                if (!isMounted) return;
                setBook(detail);
                const related = detail.categoryIds.length > 0
                    ? await getBooks({ categoryIds: detail.categoryIds, pageNumber: 1, pageSize: 4 })
                    : await getBooks({ pageNumber: 1, pageSize: 4 });
                if (!isMounted) return;
                setRelatedBooks(related.items
                    .filter((item) => item.id !== detail.id)
                    .slice(0, 3));
                const authorBooks = await getBooks({ author: detail.author, pageNumber: 1, pageSize: 4 });
                if (isMounted) setSameAuthorBooks(authorBooks.items.filter(item => item.id !== detail.id).slice(0, 3));
            })
            .catch((requestError: Error) => {
                if (isMounted) setError(requestError.message);
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [bookId, stockPolicyVersion]);

    return { book, relatedBooks, sameAuthorBooks, isLoading, error };
};

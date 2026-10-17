import { useEffect, useState } from 'react';
import { getBookReviews } from '../services/bookService';
import type { BookReviewData } from '../types/book';

export const useBookReviews = (id: number) => {
    const [page, setPage] = useState(1);
    const [items, setItems] = useState<BookReviewData[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        let active = true;
        void Promise.resolve().then(() => { if (active) { setIsLoading(true); setError(''); } });
        getBookReviews(id, page).then(result => { if (active) { setItems(result.items); setTotalCount(result.totalCount); } })
            .catch(reason => { if (active) setError(reason.message); })
            .finally(() => { if (active) setIsLoading(false); });
        return () => { active = false; };
    }, [id, page]);
    return { items, totalCount, page, setPage, error, isLoading };
};

export const getReviewImages = (json: string | null): string[] => {
    try {
        const images: unknown = JSON.parse(json || '[]');
        return Array.isArray(images) ? images.filter((url): url is string => typeof url === 'string' && /^https?:\/\//i.test(url)) : [];
    } catch { return []; }
};

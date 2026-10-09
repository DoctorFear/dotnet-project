import { useEffect, useState } from 'react';
import { getBooks } from '../services/bookService';
import { getCategories } from '../services/categoryService';
import { getPublishers } from '../services/publisherService';
import type { BookFilterParams, ProductData } from '../types/book';
import type { CategoryData } from '../types/category';
import type { PublisherData } from '../types/publisher';


export const useBookCatalog = (filters: BookFilterParams) => {
    const [books, setBooks] = useState<ProductData[]>([]);
    const [categories, setCategories] = useState<CategoryData[]>([]);
    const [publishers, setPublishers] = useState<PublisherData[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let isMounted = true;
        void Promise.resolve().then(() => {
            if (isMounted) { setIsLoading(true); setError(''); }
        });

        Promise.all([getBooks(filters), getCategories(), getPublishers()])
            .then(([bookResult, categoryResult, publisherResult]) => {
                if (!isMounted) return;
                setBooks(bookResult.items);
                setTotalCount(bookResult.totalCount);
                setCategories(categoryResult);
                setPublishers(publisherResult);
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
    }, [filters]);

    return { books, categories, publishers, totalCount, isLoading, error };
};

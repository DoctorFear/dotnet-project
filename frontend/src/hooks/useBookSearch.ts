import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getBooks } from '../services/bookService';
import { useBookFilterOptions } from './useBookFilterOptions';
import { useStockPolicyRefresh } from './useStockPolicyRefresh';
import { useWishlist } from './useWishList';
import { useToastNotifications } from './useToastNotifications';
import { useBookCartAction } from './useBookCartAction';
import type { BookFilterParams, ProductData, StorefrontFilterParams } from '../types/book';

const queryIds = (value: string | null) => {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? [id] : undefined;
};

export const useBookSearch = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const wishlist = useWishlist();
    const [sortBy, setSortBy] = useState('newest');
    const [filters, setFilters] = useState<Partial<StorefrontFilterParams>>({});
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(6);
    const [purchaseBook, setPurchaseBook] = useState<ProductData | null>(null);
    const notifications = useToastNotifications();
    const cart = useBookCartAction(notifications.notify);
    const requestFilters = useMemo(() => ({
        ...filters,
        searchTerm: searchParams.get('search') || undefined,
        categoryIds: filters.categoryIds ?? queryIds(searchParams.get('category')),
        publisherIds: filters.publisherIds ?? queryIds(searchParams.get('publisher')),
        sortBy, pageNumber: page, pageSize,
        publicationYear: filters.publishYear ? Number(filters.publishYear) : undefined,
    }), [filters, searchParams, sortBy, page, pageSize]);
    const catalog = useBookCatalog(requestFilters);
    const changeFilters = (next: Partial<StorefrontFilterParams>) => { setPage(1); setFilters(current => ({ ...current, ...next })); };
    const search = (term: string) => { setPage(1); setSearchParams(current => { if (term) current.set('search', term); else current.delete('search'); return current; }); };
    const selectCategory = (name: string) => { const category = catalog.categories.find(item => item.name === name); if (category) changeFilters({ categoryIds: [category.id] }); };
    const selectPublisher = (name: string) => { const publisher = catalog.publishers.find(item => item.name === name); if (publisher) changeFilters({ publisherIds: [publisher.id] }); };
    const resetFilters = () => { setPage(1); setFilters({}); setSearchParams({}); };
    const changeSort = (value: string) => { setPage(1); setSortBy(value); };
    const changePageSize = (size: number) => { setPage(1); setPageSize(size); };
    const selectBook = (id: number) => navigate(`/books/${id}`);
    const openPurchase = (id: number) => setPurchaseBook(catalog.books.find(book => book.id === id) ?? null);
    const toggleWishlist = (id: number) => { const book = catalog.books.find(item => item.id === id); if (book) void wishlist.toggleWishlist(book); };
    return { ...catalog, searchTerm: requestFilters.searchTerm || '', wishlist, notifications, cart, purchaseBook, setPurchaseBook, sortBy, page, pageSize, setPage, filters: { ...filters, categoryIds: requestFilters.categoryIds, publisherIds: requestFilters.publisherIds }, search, selectCategory, selectPublisher, changeFilters, resetFilters, changeSort, changePageSize, selectBook, openPurchase, toggleWishlist };
};

const useBookCatalog = (filters: BookFilterParams) => {
    const stockPolicyVersion = useStockPolicyRefresh();
    const [books, setBooks] = useState<ProductData[]>([]);
    const options = useBookFilterOptions();
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let isMounted = true;
        void Promise.resolve().then(() => {
            if (isMounted) { setIsLoading(true); setError(''); }
        });

        getBooks(filters)
            .then((bookResult) => {
                if (!isMounted) return;
                setBooks(bookResult.items);
                setTotalCount(bookResult.totalCount);
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
    }, [filters, stockPolicyVersion]);

    return { ...options, books, totalCount, isLoading, error: error || options.error };
};

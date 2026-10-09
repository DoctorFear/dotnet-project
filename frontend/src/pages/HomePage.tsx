import React, { useMemo, useState } from 'react';
import TopBar from '../components/layout/TopBar';
import Header from '../components/layout/Header';
import Navbar from '../components/layout/Navbar';
import SidebarFilter from '../components/features/storefront/SidebarFilter';
import type { FilterParams } from '../components/features/storefront/SidebarFilter';
import BookGrid from '../components/features/storefront/BookGrid';
import { useBookCatalog } from '../hooks/useBookCatalog';
import BookPagination from '../components/common/BookPagination';
import ToastNotification from '../components/common/ToastNotification';
import BookPurchaseDialog from '../components/features/storefront/BookPurchaseDialog';
import { useToastNotifications } from '../hooks/useToastNotifications';
import { useBookCartAction } from '../hooks/useBookCartAction';
import type { ProductData } from '../types/book';

export const HomePage: React.FC = () => {
    const [wishlistIds, setWishlistIds] = useState<number[]>([]);
    const [sortBy, setSortBy] = useState<string>('newest');
    const [filters, setFilters] = useState<Partial<FilterParams>>({});
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(6);
    const [purchaseBook, setPurchaseBook] = useState<ProductData | null>(null);
    const { toasts, notify, dismissToast } = useToastNotifications();
    const { isSubmitting, submitPurchase } = useBookCartAction(notify);
    const requestFilters = useMemo(() => ({
        ...filters,
        sortBy,
        pageNumber: page,
        pageSize,
        publicationYear: filters.publishYear ? Number(filters.publishYear) : undefined,
    }), [filters, sortBy, page, pageSize]);
    const { books, categories, publishers, totalCount, isLoading, error } = useBookCatalog(requestFilters);

    const handleToggleWishlist = (id: number) => {
        const book = books.find((item) => item.id === id);
        const isRemoving = wishlistIds.includes(id);
        setWishlistIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
        notify(isRemoving
            ? `Đã xóa ${book?.title || 'sách'} khỏi danh sách yêu thích.`
            : `Đã thêm ${book?.title || 'sách'} vào danh sách yêu thích.`, 'success');
    };

    return (
        <>
            {!purchaseBook && <ToastNotification toasts={toasts} onClose={dismissToast} />}
            {purchaseBook && <BookPurchaseDialog key={purchaseBook.id} book={purchaseBook} isSubmitting={isSubmitting} onClose={() => setPurchaseBook(null)} onConfirm={submitPurchase}><ToastNotification toasts={toasts} onClose={dismissToast} /></BookPurchaseDialog>}
            <style>{`
        .ab-home-page-layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--alice, #F2F7FF);
        }

        .ab-storefront-container {
          max-width: 1200px;
          width: 100%;
          margin: 24px auto;
          padding: 0 24px;
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 24px;
          align-items: start;
          flex: 1;
        }

        @media (max-width: 1024px) {
          .ab-storefront-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

            <div className="ab-home-page-layout">
                <TopBar />
                <Header wishlistCount={wishlistIds.length} cartCount={2} />
                <Navbar
                    categories={categories.map((category) => ({ id: String(category.id), name: category.name }))}
                    publishers={publishers.map((publisher) => ({ id: String(publisher.id), name: publisher.name }))}
                    onSelectCategory={(name) => {
                        const category = categories.find((item) => item.name === name);
                        if (category) { setPage(1); setFilters((current) => ({ ...current, categoryIds: [category.id] })); }
                    }}
                    onSelectPublisher={(name) => {
                        const publisher = publishers.find((item) => item.name === name);
                        if (publisher) { setPage(1); setFilters((current) => ({ ...current, publisherIds: [publisher.id] })); }
                    }}
                />

                <main className="ab-storefront-container">
                    <SidebarFilter
                        categoriesList={categories.map(({ id, name }) => ({ id, name }))}
                        publishersList={publishers.map(({ id, name }) => ({ id, name }))}
                        onFilterChange={(nextFilters) => { setPage(1); setFilters((current) => ({ ...current, ...nextFilters })); }}
                        onResetFilters={() => { setPage(1); setFilters({}); }}
                    />
                    {isLoading ? (
                        <BookGrid books={[]} emptyMessage="Đang tải danh sách sách..." />
                    ) : error ? (
                        <BookGrid books={[]} emptyMessage={error} />
                    ) : (
                        <div>
                        <BookGrid
                            books={books}
                            totalCount={totalCount}
                            wishlistIds={wishlistIds}
                            sortBy={sortBy}
                            onSortChange={(value) => { setPage(1); setSortBy(value); }}
                            onToggleWishlist={handleToggleWishlist}
                            onSelectBook={(id) => (window.location.href = `/books/${id}`)}
                            onAddToCart={(id) => setPurchaseBook(books.find((book) => book.id === id) ?? null)}
                        />
                        <BookPagination page={page} pageSize={pageSize} totalCount={totalCount} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} />
                        </div>
                    )}
                </main>
            </div>
        </>
    );
};

export default HomePage;

import React from 'react';
import styles from './HomePage.module.css';
import TopBar from '../components/layout/TopBar';
import Header from '../components/layout/Header';
import Navbar from '../components/layout/Navbar';
import SidebarFilter from '../components/features/storefront/SidebarFilter';
import BookGrid from '../components/features/storefront/BookGrid';
import BookPagination from '../components/common/BookPagination';
import ToastNotification from '../components/common/ToastNotification';
import BookPurchaseDialog from '../components/features/storefront/BookPurchaseDialog';
import WishlistLoginPrompt from '../components/features/storefront/WishlistLoginPrompt';
import { useBookSearch } from '../hooks/useBookSearch';

export const HomePage: React.FC = () => {
    const controller = useBookSearch();
    const { books, categories, publishers, totalCount, isLoading, error, wishlist, notifications, cart, purchaseBook, setPurchaseBook, sortBy, page, pageSize, setPage } = controller;
    const { toasts, dismissToast } = notifications;
    const { isSubmitting, submitPurchase } = cart;
    const { wishlistIds } = wishlist;
    return (
        <>
            {wishlist.loginPromptOpen && <WishlistLoginPrompt onClose={wishlist.closeLoginPrompt} onLogin={wishlist.goToLogin} />}
            {!purchaseBook && <ToastNotification toasts={[...wishlist.toasts, ...toasts]} onClose={id => { wishlist.dismissToast(id); dismissToast(id); }} />}
            {purchaseBook && <BookPurchaseDialog key={purchaseBook.id} book={purchaseBook} isSubmitting={isSubmitting} onClose={() => setPurchaseBook(null)} onConfirm={submitPurchase}><ToastNotification toasts={toasts} onClose={dismissToast} /></BookPurchaseDialog>}


            <div className={styles.page}>
                <TopBar />
                <Header key={controller.searchTerm} initialSearch={controller.searchTerm} wishlistCount={wishlistIds.length} onSearch={controller.search} />
                <Navbar
                    categories={categories.map((category) => ({ id: String(category.id), name: category.name }))}
                    publishers={publishers.map((publisher) => ({ id: String(publisher.id), name: publisher.name }))}
                    onSelectCategory={controller.selectCategory}
                    onSelectPublisher={controller.selectPublisher}
                />

                <main className={styles.content}>
                    <SidebarFilter
                        publicationYears={controller.publicationYears}
                        filters={controller.filters}
                        categoriesList={categories.map(({ id, name }) => ({ id, name }))}
                        publishersList={publishers.map(({ id, name }) => ({ id, name }))}
                        onFilterChange={controller.changeFilters}
                        onResetFilters={controller.resetFilters}
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
                            onSortChange={controller.changeSort}
                            onToggleWishlist={controller.toggleWishlist}
                            onSelectBook={controller.selectBook}
                            onAddToCart={controller.openPurchase}
                        />
                        <BookPagination page={page} pageSize={pageSize} totalCount={totalCount} onPageChange={setPage} onPageSizeChange={controller.changePageSize} />
                        </div>
                    )}
                </main>
            </div>
        </>
    );
};

export default HomePage;

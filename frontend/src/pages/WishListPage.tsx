import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/layout/TopBar';
import Header from '../components/layout/Header';
import Navbar from '../components/layout/Navbar';
import Breadcrumb from '../components/common/Breadcrumb';
import ProductCard from '../components/common/ProductCard';
import BookPagination from '../components/common/BookPagination';
import ToastNotification from '../components/common/ToastNotification';
import BookPurchaseDialog from '../components/features/storefront/BookPurchaseDialog';
import { useWishlist } from '../hooks/useWishList';
import { useBookCartAction } from '../hooks/useBookCartAction';
import { useToastNotifications } from '../hooks/useToastNotifications';
import type { ProductData } from '../types/book';
import styles from './WishListPage.module.css';
import { useBookFilterOptions } from '../hooks/useBookFilterOptions';

export default function WishListPage() {
    const navigate = useNavigate();
    const wishlist = useWishlist();
    const options = useBookFilterOptions();
    const notifications = useToastNotifications();
    const { isSubmitting, submitPurchase } = useBookCartAction(notifications.notify);
    const [purchaseBook, setPurchaseBook] = useState<ProductData | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(6);
    const currentPage = Math.min(page, Math.max(1, Math.ceil(wishlist.wishlistCount / pageSize)));
    const messages = <ToastNotification toasts={[...wishlist.toasts, ...notifications.toasts]} onClose={id => { wishlist.dismissToast(id); notifications.dismissToast(id); }} />;

    return <div className={styles.page}>
        {!purchaseBook && messages}
        {purchaseBook && <BookPurchaseDialog book={purchaseBook} isSubmitting={isSubmitting} onClose={() => setPurchaseBook(null)} onConfirm={submitPurchase}>{messages}</BookPurchaseDialog>}
        <TopBar /><Header wishlistCount={wishlist.wishlistCount} onSearch={term => navigate(`/?search=${encodeURIComponent(term)}`)} /><Navbar categories={options.categories.map(({ id, name }) => ({ id: String(id), name }))} publishers={options.publishers.map(({ id, name }) => ({ id: String(id), name }))} onSelectCategory={name => { const category = options.categories.find(item => item.name === name); if (category) navigate(`/?category=${category.id}`); }} onSelectPublisher={name => { const publisher = options.publishers.find(item => item.name === name); if (publisher) navigate(`/?publisher=${publisher.id}`); }} />
        <main className={styles.content}>
            <Breadcrumb items={[{ label: 'Trang chủ', link: '/' }, { label: 'Danh sách yêu thích' }]} />
            <h1>Danh sách sách yêu thích ({wishlist.wishlistCount})</h1>
            {wishlist.isLoading ? <p>Đang tải danh sách yêu thích...</p> : wishlist.error ? <p role="alert">{wishlist.error}</p> : wishlist.wishlistCount === 0 ? <p>Chưa có sách trong danh sách yêu thích.</p> : <>
                <div className={styles.grid}>{wishlist.wishlistItems.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(book => <ProductCard key={book.id} product={book} onToggleWishlist={() => void wishlist.toggleWishlist(book)} onSelectBook={id => navigate(`/books/${id}`)} onAddToCart={() => setPurchaseBook(book)} />)}</div>
                <BookPagination page={currentPage} pageSize={pageSize} totalCount={wishlist.wishlistCount} onPageChange={setPage} onPageSizeChange={size => { setPageSize(size); setPage(1); }} />
            </>}
        </main>
    </div>;
}

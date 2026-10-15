import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TopBar from '../components/layout/TopBar';
import Header from '../components/layout/Header';
import Navbar from '../components/layout/Navbar';
import Breadcrumb from '../components/common/Breadcrumb';
import StarRating from '../components/common/StarRating';
import ProductCard from '../components/common/ProductCard';
import { useBookDetail } from '../hooks/useBookDetail';
import { useBookPurchaseSelection } from '../hooks/useBookPurchaseSelection';
import { useBookCartAction } from '../hooks/useBookCartAction';
import { useToastNotifications } from '../hooks/useToastNotifications';
import ToastNotification from '../components/common/ToastNotification';
import BookPurchaseOptions from '../components/features/storefront/BookPurchaseOptions';
import BookPurchaseDialog from '../components/features/storefront/BookPurchaseDialog';
import type { ProductData } from '../types/book';
import styles from './BookDetailPage.module.css';
import { useWishlist } from '../hooks/useWishList';
import WishListButton from '../components/common/WishListButton';
import BookGallery from '../components/features/storefront/BookGallery';
import BookReviews from '../components/features/storefront/BookReviews';
import WishlistLoginPrompt from '../components/features/storefront/WishlistLoginPrompt';
import { useBookFilterOptions } from '../hooks/useBookFilterOptions';
import StockAvailabilityBadge from '../components/common/StockAvailabilityBadge';

export const BookDetailPage: React.FC = () => {
    const { id } = useParams();
    const { book: bookData, relatedBooks, sameAuthorBooks, isLoading, error } = useBookDetail(id);
    const navigate = useNavigate();
    const wishlist = useWishlist();
    const options = useBookFilterOptions();
    const purchaseData = bookData;
    const selection = useBookPurchaseSelection(purchaseData);
    const { toasts, notify, dismissToast } = useToastNotifications();
    const { isSubmitting, submitPurchase } = useBookCartAction(notify);
    const [purchaseBook, setPurchaseBook] = useState<ProductData | null>(null);
    const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');

    const galleryImages = bookData ? [...new Set([bookData.coverImg, ...bookData.galleryImages].filter(Boolean))] : [];

    if (isLoading) {
        return <div className={styles.containerDetail}>Đang tải thông tin sách...</div>;
    }

    if (!bookData) {
        return <div className={styles.containerDetail}>{error || 'Không tìm thấy thông tin sách.'}</div>;
    }


    const canPurchase = bookData.status === 'selling' && !(selection.format === 'physical' && bookData.stockCount < selection.quantity);
    return (
        <div className={styles.page}>
            {wishlist.loginPromptOpen && <WishlistLoginPrompt onClose={wishlist.closeLoginPrompt} onLogin={wishlist.goToLogin} />}
            {!purchaseBook && <ToastNotification toasts={[...wishlist.toasts, ...toasts]} onClose={id => { wishlist.dismissToast(id); dismissToast(id); }} />}
            {purchaseBook && <BookPurchaseDialog key={purchaseBook.id} book={purchaseBook} isSubmitting={isSubmitting} onClose={() => setPurchaseBook(null)} onConfirm={submitPurchase}><ToastNotification toasts={toasts} onClose={dismissToast} /></BookPurchaseDialog>}
            <TopBar />
            <Header wishlistCount={wishlist.wishlistCount} onSearch={term => navigate(`/?search=${encodeURIComponent(term)}`)} />
            <Navbar onSelectCategory={name => { const category = options.categories.find(item => item.name === name); if (category) navigate(`/?category=${category.id}`); }} onSelectPublisher={name => { const publisher = options.publishers.find(item => item.name === name); if (publisher) navigate(`/?publisher=${publisher.id}`); }} categories={options.categories.map(({ id, name }) => ({ id: String(id), name }))} publishers={options.publishers.map(({ id, name }) => ({ id: String(id), name }))} />

            <main className={styles.containerDetail}>
                <Breadcrumb
                    items={[
                        { label: 'Trang chủ', link: '/' },
                        { label: bookData.categories[0] || 'Sách', link: bookData.categoryIds[0] ? `/?category=${bookData.categoryIds[0]}` : '/' },
                        { label: bookData.title },
                    ]}
                />

                <div className={styles.detailPanel}>
                    <div className={styles.galleryWrap}>
                        <BookGallery title={bookData.title} images={galleryImages} />
                    </div>

                    <div className={styles.detailInfo}>
                        <h1 className={styles.detailTitle}>{bookData.title}</h1>
                        <WishListButton isWishlisted={wishlist.wishlistIds.includes(bookData.id)} onToggle={() => void wishlist.toggleWishlist(bookData)} />
                        <div className={styles.detailMeta}>
                            <span>Tác giả: <strong>{bookData.author}</strong></span>
                            <span>NXB: <a href={`/?publisher=${bookData.publisherId}`}>{bookData.publisher}</a></span>
                        </div>

                        <div className={styles.categories}>
                            {bookData.categories.map((cat, i) => (
                                <a key={i} href={`/?category=${bookData.categoryIds[i]}`}>
                                    {cat}
                                </a>
                            ))}
                        </div>

                        <StarRating rating={bookData.rating} reviewsCount={bookData.reviewsCount} />
                        <StockAvailabilityBadge book={bookData} />

                        <div className={styles.priceBoxPanel}>
                            <span className={styles.detailSalePrice}>
                                {selection.price.toLocaleString('vi-VN')} đ
                            </span>
                        </div>

                        {bookData.status !== 'selling' && <p role="status">{bookData.status === 'stopped' ? 'Sách đã ngừng kinh doanh.' : 'Sách sắp phát hành.'}</p>}
                        {bookData.status === 'selling' && purchaseData && <BookPurchaseOptions book={purchaseData} selection={selection} disabled={isSubmitting} />}

                        {bookData.status === 'selling' && <div className={styles.actionBtnsGroup}>
                            <button
                                type="button"
                                className={styles.btnAddCartLg}
                                disabled={isSubmitting || !canPurchase}
                                onClick={() => { if (purchaseData) void submitPurchase(purchaseData, selection); }}
                            >
                                Thêm vào giỏ hàng
                            </button>
                            <button
                                type="button"
                                className={styles.btnBuyNowLg}
                                disabled={isSubmitting || !canPurchase}
                                onClick={async () => { if (purchaseData && await submitPurchase(purchaseData, selection)) navigate('/cart'); }}
                            >
                                Mua ngay
                            </button>
                        </div>}
                    </div>
                </div>

                <div className={styles.tabsContainer}>
                    <div className={styles.tabHeaders}>
                        <div
                            className={`${styles.tabBtn} ${activeTab === 'desc' ? styles.tabBtnActive : ''}`}
                            onClick={() => setActiveTab('desc')}
                        >
                            Mô tả nội dung
                        </div>
                        <div
                            className={`${styles.tabBtn} ${activeTab === 'specs' ? styles.tabBtnActive : ''}`}
                            onClick={() => setActiveTab('specs')}
                        >
                            Thông số kỹ thuật
                        </div>
                        <div
                            className={`${styles.tabBtn} ${activeTab === 'reviews' ? styles.tabBtnActive : ''}`}
                            onClick={() => setActiveTab('reviews')}
                        >
                            Đánh giá khách hàng ({bookData.reviewsCount})
                        </div>
                    </div>

                    {activeTab === 'desc' && <p className={styles.description}>{bookData.description || 'Chưa có mô tả nội dung.'}</p>}

                    {activeTab === 'specs' && (
                        <table className={styles.specsTable}>
                            <tbody>
                                <tr><td>Mã ISBN</td><td>{bookData.isbn}</td></tr>
                                <tr><td>Thể loại</td><td>{bookData.categories.join(', ')}</td></tr>
                                <tr><td>Nhà xuất bản</td><td>{bookData.publisher}</td></tr>
                                <tr><td>Năm xuất bản</td><td>{bookData.publicationYear || 'Chưa cập nhật'}</td></tr>
                                <tr><td>Số trang</td><td>{bookData.pages ? `${bookData.pages} trang` : 'Chưa cập nhật'}</td></tr>
                                <tr><td>Trọng lượng</td><td>{bookData.weight ? `${bookData.weight} g` : 'Chưa cập nhật'}</td></tr>
                                <tr><td>Ngôn ngữ</td><td>{bookData.language || 'Chưa cập nhật'}</td></tr>
                                <tr><td>Kích thước</td><td>{bookData.dimensions || 'Chưa cập nhật'}</td></tr>
                            </tbody>
                        </table>
                    )}

                    {activeTab === 'reviews' && (
                        <BookReviews key={bookData.id} bookId={bookData.id} />
                    )}
                </div>

                <section className={styles.relatedSection}>
                    <h3 className={styles.relatedTitle}>Sách Cùng Thể Loại Gợi Ý</h3>
                    <div className={styles.relatedGrid}>
                        {relatedBooks.map((book) => (
                            <ProductCard key={book.id} product={book} isWishlisted={wishlist.wishlistIds.includes(book.id)} onToggleWishlist={() => void wishlist.toggleWishlist(book)} onSelectBook={(bookId) => navigate(`/books/${bookId}`)} onAddToCart={() => setPurchaseBook(book)} />
                        ))}
                    </div>
                </section>
                {sameAuthorBooks.length > 0 && <section className={styles.relatedSection}>
                    <h3 className={styles.relatedTitle}>Sách cùng tác giả</h3>
                    <div className={styles.relatedGrid}>{sameAuthorBooks.map(book => <ProductCard key={book.id} product={book} isWishlisted={wishlist.wishlistIds.includes(book.id)} onToggleWishlist={() => void wishlist.toggleWishlist(book)} onSelectBook={bookId => navigate(`/books/${bookId}`)} onAddToCart={() => setPurchaseBook(book)} />)}</div>
                </section>}
            </main>
        </div>
    );
};

export default BookDetailPage;

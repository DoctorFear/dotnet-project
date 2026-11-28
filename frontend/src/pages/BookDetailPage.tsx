import React, { useCallback, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useUser } from '../context/UserContext';
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
import BookReviewEntry from '../components/features/storefront/BookReviewEntry';
import WishlistLoginPrompt from '../components/features/storefront/WishlistLoginPrompt';
import StockAvailabilityBadge from '../components/common/StockAvailabilityBadge';
import { useBookFilterOptions } from '../hooks/useBookFilterOptions';

export const BookDetailPage: React.FC = () => {
    const { id } = useParams();
    const { book: bookData, relatedBooks, sameAuthorBooks, isLoading, error } = useBookDetail(id);
    const navigate = useNavigate();
    const location = useLocation();
    const { isLoggedIn } = useUser();
    const wishlist = useWishlist();
    const options = useBookFilterOptions();
    const purchaseData = bookData;
    const [searchParams] = useSearchParams();
    const initialFormat = searchParams.get('format') === 'rental' ? 'rental' : 'physical';
    const selection = useBookPurchaseSelection(purchaseData, initialFormat);
    const { toasts, notify, dismissToast } = useToastNotifications();
    const { isSubmitting, submitPurchase } = useBookCartAction(notify);
    const [purchaseBook, setPurchaseBook] = useState<ProductData | null>(null);
    const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');
    const [reviewCounts, setReviewCounts] = useState<Record<number, number>>({});
    const [reviewRefreshVersion, setReviewRefreshVersion] = useState(0);
    const updateReviewCount = useCallback((bookId: number, count: number) => {
        setReviewCounts(current => current[bookId] === count ? current : { ...current, [bookId]: count });
    }, []);
    const refreshReviews = useCallback(() => {
        setReviewRefreshVersion((current) => current + 1);
    }, []);

    const galleryImages = bookData ? [...new Set([bookData.coverImg, ...bookData.galleryImages].filter(Boolean))] : [];

    if (isLoading) {
        return <div className={styles.containerDetail}>Đang tải thông tin sách...</div>;
    }

    if (!bookData) {
        return <div className={styles.containerDetail}>{error || 'Không tìm thấy thông tin sách.'}</div>;
    }


    // Mua ngay: Chuyển hướng trực tiếp đến trang xác nhận thanh toán chỉ riêng sản phẩm được chọn
    const handleBuyNow = () => {
        if (!bookData || !canPurchase) return;
        if (!isLoggedIn) {
            navigate('/login', { state: { from: location } });
            return;
        }

        const immediateCheckoutItem = {
            cartItemId: 0,
            bookId: bookData.id,
            title: bookData.title,
            author: bookData.author,
            coverImg: bookData.coverImg,
            quantity: selection.format === 'physical' ? selection.quantity : 1,
            purchaseType: selection.format === 'physical' ? 1 : selection.format === 'rental' ? 2 : 3,
            rentalDuration: selection.format === 'rental' ? { week: 1, month: 2, year: 3 }[selection.duration] : null,
            unitPrice: selection.price,
            isSelected: true,
        };

        navigate('/checkout', { state: { selectedItems: [immediateCheckoutItem] } });
    };

    const hasPhysical = bookData.isPhysicalAvailable && (bookData.stockCount ?? 0) > 0;
    const hasPublishedEbook = Boolean(bookData.hasPublishedEbook);
    const hasAnyRentalPrice =
        (bookData.weeklyRentalPrice ?? 0) > 0 ||
        (bookData.monthlyRentalPrice ?? 0) > 0 ||
        (bookData.yearlyRentalPrice ?? 0) > 0;
    const hasEBook = bookData.isEBookAvailable && bookData.eBookPrice > 0 && hasPublishedEbook;
    const hasRental = bookData.isRentalAvailable && hasAnyRentalPrice && hasPublishedEbook;
    const hasAnyActiveFormat = hasPhysical || hasEBook || hasRental;

    const canPurchase = bookData.status === 'selling' && hasAnyActiveFormat && selection.isCurrentFormatAvailable && !(selection.format === 'physical' && bookData.stockCount < selection.quantity);
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
                        <div className={styles.titleRow}><h1 className={styles.detailTitle}>{bookData.title}</h1><WishListButton className={styles.detailWishlist} isWishlisted={wishlist.wishlistIds.includes(bookData.id)} onToggle={() => void wishlist.toggleWishlist(bookData)} /></div>
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

                        <StarRating rating={bookData.rating} reviewsCount={reviewCounts[bookData.id] ?? bookData.reviewsCount} />

                        <div className={styles.priceBoxPanel}>
                            <span className={styles.detailSalePrice}>
                                {selection.price.toLocaleString('vi-VN')} đ
                            </span>
                        </div>

                        {bookData.status === 'selling' && hasPhysical && bookData.stockStatus === 'low_stock' && (
                            <div style={{ margin: '10px 0 4px' }}>
                                <StockAvailabilityBadge book={bookData} />
                            </div>
                        )}

                        {bookData.status === 'stopped' && (
                            <div>
                                <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '13.5px', fontWeight: 600, margin: '14px 0' }}>
                                    Tác phẩm hiện đã ngừng kinh doanh trên toàn hệ thống.
                                </div>
                                <div className={styles.actionBtnsGroup}>
                                    <button
                                        type="button"
                                        className={styles.btnAddCartLg}
                                        disabled
                                        style={{ backgroundColor: '#f1f5f9', color: '#94a3b8', borderColor: '#e2e8f0', cursor: 'not-allowed' }}
                                    >
                                        Ngừng kinh doanh
                                    </button>
                                </div>
                            </div>
                        )}

                        {bookData.status === 'upcoming' && (
                            <div>
                                <div style={{ padding: '12px 16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', fontSize: '13.5px', fontWeight: 600, margin: '14px 0' }}>
                                    Sách sắp phát hành. Quý độc giả vui lòng đón đọc!
                                </div>
                                <div className={styles.actionBtnsGroup}>
                                    <button
                                        type="button"
                                        className={styles.btnAddCartLg}
                                        disabled
                                        style={{ backgroundColor: '#f1f5f9', color: '#94a3b8', borderColor: '#e2e8f0', cursor: 'not-allowed' }}
                                    >
                                        Sắp phát hành
                                    </button>
                                </div>
                            </div>
                        )}

                        {bookData.status === 'selling' && !hasAnyActiveFormat && (
                            <div>
                                <div style={{ padding: '12px 16px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', color: '#92400e', fontSize: '13.5px', fontWeight: 600, margin: '14px 0' }}>
                                    Sản phẩm tạm thời hết hàng. Quý khách vui lòng quay lại sau!
                                </div>
                                <div className={styles.actionBtnsGroup}>
                                    <button
                                        type="button"
                                        className={styles.btnAddCartLg}
                                        disabled
                                        style={{ backgroundColor: '#f1f5f9', color: '#94a3b8', borderColor: '#e2e8f0', cursor: 'not-allowed' }}
                                    >
                                        Tạm hết hàng
                                    </button>
                                </div>
                            </div>
                        )}

                        {bookData.status === 'selling' && hasAnyActiveFormat && purchaseData && (
                            <BookPurchaseOptions book={purchaseData} selection={selection} disabled={isSubmitting} />
                        )}

                        {bookData.status === 'selling' && hasAnyActiveFormat && (
                            <div className={styles.actionBtnsGroup}>
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
                                    onClick={handleBuyNow}
                                >
                                    Mua ngay
                                </button>
                            </div>
                        )}
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
                            Đánh giá khách hàng ({reviewCounts[bookData.id] ?? bookData.reviewsCount})
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
                        <div className={styles.reviewTabContent}>
                            <BookReviewEntry bookId={bookData.id} onReviewSaved={refreshReviews} />
                            <BookReviews
                                key={`${bookData.id}-${reviewRefreshVersion}`}
                                bookId={bookData.id}
                                onCountChange={updateReviewCount}
                            />
                        </div>
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

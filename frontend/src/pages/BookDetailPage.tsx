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

export const BookDetailPage: React.FC = () => {
    const { id } = useParams();
    const { book: bookData, relatedBooks, isLoading, error } = useBookDetail(id);
    const navigate = useNavigate();
    const purchaseData = bookData;
    const selection = useBookPurchaseSelection(purchaseData);
    const { toasts, notify, dismissToast } = useToastNotifications();
    const { isSubmitting, submitPurchase } = useBookCartAction(notify);
    const [purchaseBook, setPurchaseBook] = useState<ProductData | null>(null);
    const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');

    const [mainImg, setMainImg] = useState('');
    const galleryImages = bookData ? [...new Set([bookData.coverImg, ...bookData.galleryImages].filter(Boolean))] : [];
    const displayedImage = galleryImages.includes(mainImg) ? mainImg : galleryImages[0];

    if (isLoading) {
        return <div className={styles.containerDetail}>Đang tải thông tin sách...</div>;
    }

    if (!bookData) {
        return <div className={styles.containerDetail}>{error || 'Không tìm thấy thông tin sách.'}</div>;
    }


    return (
        <div style={{ background: 'var(--alice, #F2F7FF)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {!purchaseBook && <ToastNotification toasts={toasts} onClose={dismissToast} />}
            {purchaseBook && <BookPurchaseDialog key={purchaseBook.id} book={purchaseBook} isSubmitting={isSubmitting} onClose={() => setPurchaseBook(null)} onConfirm={submitPurchase}><ToastNotification toasts={toasts} onClose={dismissToast} /></BookPurchaseDialog>}
            <TopBar />
            <Header />
            <Navbar />

            <main className={styles.containerDetail}>
                <Breadcrumb
                    items={[
                        { label: 'Trang chủ', link: '/' },
                        { label: 'Văn học Việt Nam', link: '#' },
                        { label: bookData.title },
                    ]}
                />

                <div className={styles.detailPanel}>
                    <div className={styles.galleryWrap}>
                        <div className={styles.mainImgBox}>
                            <img src={displayedImage} alt={bookData.title} className={styles.mainImg} />
                        </div>
                        <div className={styles.thumbList}>
                            {galleryImages.map((img, idx) => (
                                <img
                                    key={idx}
                                    src={img}
                                    alt={`Thumbnail ${idx}`}
                                    className={`${styles.thumbItem} ${displayedImage === img ? styles.thumbItemActive : ''}`}
                                    onClick={() => setMainImg(img)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className={styles.detailInfo}>
                        <h1 className={styles.detailTitle}>{bookData.title}</h1>
                        <div className={styles.detailMeta}>
                            <span>Tác giả: <strong>{bookData.author}</strong></span>
                            <span>NXB: <strong>{bookData.publisher}</strong></span>
                        </div>

                        <div style={{ display: 'flex', gap: '6px', margin: '8px 0' }}>
                            {bookData.categories.map((cat, i) => (
                                <span key={i} style={{ background: '#eef2ff', color: '#3730a3', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px' }}>
                                    {cat}
                                </span>
                            ))}
                        </div>

                        <StarRating rating={bookData.rating} reviewsCount={bookData.reviewsCount} />

                        <div className={styles.priceBoxPanel}>
                            <span className={styles.detailSalePrice}>
                                {selection.price.toLocaleString('vi-VN')} đ
                            </span>
                        </div>

                        {purchaseData && <BookPurchaseOptions book={purchaseData} selection={selection} disabled={isSubmitting} />}

                        <div className={styles.actionBtnsGroup}>
                            <button
                                type="button"
                                className={styles.btnAddCartLg}
                                disabled={isSubmitting}
                                onClick={() => { if (purchaseData) void submitPurchase(purchaseData, selection); }}
                            >
                                Thêm vào giỏ hàng
                            </button>
                            <button
                                type="button"
                                className={styles.btnBuyNowLg}
                                disabled={isSubmitting}
                                onClick={async () => { if (purchaseData && await submitPurchase(purchaseData, selection)) navigate('/cart'); }}
                            >
                                Mua ngay
                            </button>
                        </div>
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

                    {activeTab === 'desc' && <p style={{ fontSize: '13.5px', lineHeight: '1.7' }}>{bookData.description}</p>}

                    {activeTab === 'specs' && (
                        <table className={styles.specsTable}>
                            <tbody>
                                <tr><td>Mã ISBN</td><td>{bookData.isbn}</td></tr>
                                <tr><td>Thể loại</td><td>{bookData.categories.join(', ')}</td></tr>
                                <tr><td>Nhà xuất bản</td><td>{bookData.publisher}</td></tr>
                                <tr><td>Năm xuất bản</td><td>{bookData.publicationYear || 'Chưa cập nhật'}</td></tr>
                                <tr><td>Số trang</td><td>{bookData.pages} trang</td></tr>
                                <tr><td>Trọng lượng</td><td>{bookData.weight ? `${bookData.weight} g` : 'Chưa cập nhật'}</td></tr>
                            </tbody>
                        </table>
                    )}

                    {activeTab === 'reviews' && (
                        <div style={{ fontSize: '13px' }}>
                            <p><strong>Đánh giá trung bình:</strong> ★ {bookData.rating} / 5 ({bookData.reviewsCount} bình luận)</p>
                        </div>
                    )}
                </div>

                <section className={styles.relatedSection}>
                    <h3 className={styles.relatedTitle}>Sách Cùng Thể Loại Gợi Ý</h3>
                    <div className={styles.relatedGrid}>
                        {relatedBooks.map((book) => (
                            <ProductCard key={book.id} product={book} onSelectBook={(bookId) => navigate(`/books/${bookId}`)} onAddToCart={() => setPurchaseBook(book)} />
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default BookDetailPage;

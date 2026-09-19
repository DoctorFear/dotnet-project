import React, { useState } from 'react';
import TopBar from '../components/layout/TopBar';
import Header from '../components/layout/Header';
import Navbar from '../components/layout/Navbar';
import Breadcrumb from '../components/common/Breadcrumb';
import StarRating from '../components/common/StarRating';
import QuantitySelector from '../components/common/QuantitySelector';
import ProductCard from '../components/common/ProductCard';
import type { ProductData } from '../types/product';
import styles from './BookDetailPage.module.css';

export const BookDetailPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');
    const [selectedOption, setSelectedOption] = useState<'physical' | 'ebook' | 'rental'>('physical');
    const [rentalDuration, setRentalDuration] = useState<'week' | 'month' | 'year'>('week');
    const [quantity, setQuantity] = useState<number>(1);

    const galleryImages = [
        'https://salt.tikicdn.com/ts/product/45/3e/2e/9f992ab2a5436d4f937d9fae16d47b53.jpg',
        'https://salt.tikicdn.com/ts/product/19/22/e0/aa29986348ef0eeab07ff83f99e3cae6.jpg',
        'https://nhasachphuongnam.com/images/detailed/181/81yvSg0d7AL._AC_SL1500_.jpg',
    ];
    const [mainImg, setMainImg] = useState<string>(galleryImages[0]);

    const bookData = {
        id: 'B01',
        title: 'Số Đỏ (Tái bản khổ lớn nghệ thuật)',
        author: 'Vũ Trọng Phụng',
        publisher: 'NXB Văn Học',
        categories: ['Văn học Việt Nam', 'Tiểu thuyết Trào phúng'],
        isbn: '978-604-976-123-4',
        publishYear: 2025,
        pages: 284,
        coverType: 'Bìa Mềm Khổ Lớn Nghệ Thuật',
        physicalPrice: 85000,
        eBookPrice: 45000,
        weeklyPrice: 15000,
        monthlyPrice: 35000,
        yearlyPrice: 95000,
        rating: 4.8,
        reviewsCount: 124,
        stockCount: 3,
        description:
            'Số Đỏ là một trong những kiệt tác văn học trào phúng xuất sắc nhất của nhà văn Vũ Trọng Phụng.',
    };

    const relatedBooks: ProductData[] = [
        {
            id: 'B02',
            title: 'Tội Lỗi Và Hình Phạt (Tập 1)',
            author: 'Fyodor Dostoevsky',
            publisher: 'NXB Tri Thức',
            categories: ['Văn học Cổ điển', 'Tâm lý học'],
            coverImg: 'https://salt.tikicdn.com/ts/product/19/22/e0/aa29986348ef0eeab07ff83f99e3cae6.jpg',
            isPhysicalAvailable: true,
            physicalPrice: 145000,
            isEBookAvailable: true,
            eBookPrice: 75000,
            rating: 4.9,
            reviewsCount: 89,
            stockStatus: 'in_stock',
            stockCount: 15,
        },
        {
            id: 'B03',
            title: 'Vụ Án Mạng Trên Chuyến Tàu Tốc Hành Phương Đông',
            author: 'Agatha Christie',
            publisher: 'NXB Trẻ',
            categories: ['Tiểu thuyết Trinh thám', 'Văn học Cổ điển'],
            coverImg: 'https://nhasachphuongnam.com/images/detailed/181/81yvSg0d7AL._AC_SL1500_.jpg',
            isPhysicalAvailable: false,
            isEBookAvailable: true,
            eBookPrice: 68000,
            isRentalAvailable: true,
            weeklyRentalPrice: 20000,
            rating: 4.7,
            reviewsCount: 210,
            stockStatus: 'in_stock',
        },
    ];

    const getSelectedPrice = () => {
        if (selectedOption === 'physical') return bookData.physicalPrice;
        if (selectedOption === 'ebook') return bookData.eBookPrice;
        if (rentalDuration === 'week') return bookData.weeklyPrice;
        if (rentalDuration === 'month') return bookData.monthlyPrice;
        return bookData.yearlyPrice;
    };

    return (
        <div style={{ background: 'var(--alice, #F2F7FF)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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
                            <img src={mainImg} alt={bookData.title} className={styles.mainImg} />
                        </div>
                        <div className={styles.thumbList}>
                            {galleryImages.map((img, idx) => (
                                <img
                                    key={idx}
                                    src={img}
                                    alt={`Thumbnail ${idx}`}
                                    className={`${styles.thumbItem} ${mainImg === img ? styles.thumbItemActive : ''}`}
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
                                {getSelectedPrice().toLocaleString('vi-VN')} đ
                            </span>
                        </div>

                        <div className={styles.optionsSection}>
                            <div className={styles.sectionLabel}>Lựa chọn hình thức sở hữu:</div>
                            <div className={styles.optionsGrid}>
                                <div
                                    className={`${styles.optCard} ${selectedOption === 'physical' ? styles.optCardActive : ''}`}
                                    onClick={() => setSelectedOption('physical')}
                                >
                                    <div className={styles.optTitle}>📖 Sách Giấy</div>
                                    <div className={styles.optPrice}>{bookData.physicalPrice.toLocaleString('vi-VN')} đ</div>
                                </div>

                                {bookData.eBookPrice !== undefined && (
                                    <div
                                        className={`${styles.optCard} ${selectedOption === 'ebook' ? styles.optCardActive : ''}`}
                                        onClick={() => setSelectedOption('ebook')}
                                    >
                                        <div className={styles.optTitle}>💻 E-Book Online</div>
                                        <div className={styles.optPrice}>{bookData.eBookPrice.toLocaleString('vi-VN')} đ</div>
                                    </div>
                                )}

                                <div
                                    className={`${styles.optCard} ${selectedOption === 'rental' ? styles.optCardActive : ''}`}
                                    onClick={() => setSelectedOption('rental')}
                                >
                                    <div className={styles.optTitle}>⏳ Thuê Đọc</div>
                                    <div className={styles.optPrice}>Từ {bookData.weeklyPrice.toLocaleString('vi-VN')} đ</div>
                                </div>
                            </div>
                        </div>

                        {selectedOption === 'rental' && (
                            <div className={styles.rentalBox}>
                                <div className={styles.sectionLabel}>Chọn thời hạn thuê online:</div>
                                <div className={styles.durBtns}>
                                    <button
                                        type="button"
                                        className={`${styles.durBtn} ${rentalDuration === 'week' ? styles.durBtnActive : ''}`}
                                        onClick={() => setRentalDuration('week')}
                                    >
                                        1 Tuần ({bookData.weeklyPrice.toLocaleString('vi-VN')} đ)
                                    </button>
                                    <button
                                        type="button"
                                        className={`${styles.durBtn} ${rentalDuration === 'month' ? styles.durBtnActive : ''}`}
                                        onClick={() => setRentalDuration('month')}
                                    >
                                        1 Tháng ({bookData.monthlyPrice.toLocaleString('vi-VN')} đ)
                                    </button>
                                    <button
                                        type="button"
                                        className={`${styles.durBtn} ${rentalDuration === 'year' ? styles.durBtnActive : ''}`}
                                        onClick={() => setRentalDuration('year')}
                                    >
                                        1 Năm ({bookData.yearlyPrice.toLocaleString('vi-VN')} đ)
                                    </button>
                                </div>
                            </div>
                        )}

                        {selectedOption === 'physical' && (
                            <div>
                                <div className={styles.sectionLabel}>Số lượng mua:</div>
                                <QuantitySelector value={quantity} onChange={(val) => setQuantity(val)} max={bookData.stockCount} />
                            </div>
                        )}

                        <div className={styles.actionBtnsGroup}>
                            <button
                                type="button"
                                className={styles.btnAddCartLg}
                                onClick={() => alert(`Đã thêm ${bookData.title} vào giỏ hàng!`)}
                            >
                                Thêm vào giỏ hàng
                            </button>
                            <button
                                type="button"
                                className={styles.btnBuyNowLg}
                                onClick={() => (window.location.href = '/cart')}
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
                                <tr><td>Năm xuất bản</td><td>{bookData.publishYear}</td></tr>
                                <tr><td>Số trang</td><td>{bookData.pages} trang</td></tr>
                                <tr><td>Hình thức bìa</td><td>{bookData.coverType}</td></tr>
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
                            <ProductCard key={book.id} product={book} />
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default BookDetailPage;
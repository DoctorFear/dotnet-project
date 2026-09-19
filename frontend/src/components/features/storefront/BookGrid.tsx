import React from 'react';
import styles from './BookGrid.module.css';
import ProductCard from '../../common/ProductCard';
import type { ProductData } from '../../common/ProductCard';

interface BookGridProps {
    books: ProductData[];
    wishlistIds?: string[];
    sortBy?: string;
    onSortChange?: (sortValue: string) => void;
    onToggleWishlist?: (id: string) => void;
    onSelectBook?: (id: string) => void;
    onAddToCart?: (id: string) => void;
    className?: string;
}

export const BookGrid: React.FC<BookGridProps> = ({
    books,
    wishlistIds = [],
    sortBy = 'newest',
    onSortChange,
    onToggleWishlist,
    onSelectBook,
    onAddToCart,
    className = '',
}) => {
    return (
        <section className={`${styles.productsColumn} ${className}`}>
            {/* Thanh hiển thị số lượng & Dropdown Sắp xếp */}
            <div className={styles.resultsSortingBar}>
                <div>
                    Hiển thị <strong>{books.length}</strong> sản phẩm phù hợp
                </div>
                <div>
                    <select
                        className={styles.sortDropdown}
                        value={sortBy}
                        onChange={(e) => onSortChange?.(e.target.value)}
                    >
                        <option value="newest">Mới nhất (Mặc định)</option>
                        <option value="bestseller">Bán chạy nhất</option>
                        <option value="price_asc">Giá từ thấp đến cao</option>
                        <option value="price_desc">Giá từ cao đến thấp</option>
                    </select>
                </div>
            </div>

            {/* Khung Lưới Sách */}
            <div className={styles.productsGrid}>
                {books.length > 0 ? (
                    books.map((book) => (
                        <ProductCard
                            key={book.id}
                            product={book}
                            isWishlisted={wishlistIds.includes(book.id)}
                            onToggleWishlist={onToggleWishlist}
                            onSelectBook={onSelectBook}
                            onAddToCart={onAddToCart}
                        />
                    ))
                ) : (
                    <div className={styles.emptyState}>
                        Rất tiếc, không tìm thấy sản phẩm phù hợp với bộ lọc của bạn.
                    </div>
                )}
            </div>
        </section>
    );
};

export default BookGrid;
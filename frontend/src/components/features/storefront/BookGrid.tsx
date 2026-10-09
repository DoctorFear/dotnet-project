import React from 'react';
import styles from './BookGrid.module.css';
import ProductCard from '../../common/ProductCard';
import type { ProductData } from '../../../types/book';

interface BookGridProps {
    books: ProductData[];
    totalCount?: number;
    emptyMessage?: string;
    wishlistIds?: number[];
    sortBy?: string;
    onSortChange?: (sortValue: string) => void;
    onToggleWishlist?: (id: number) => void;
    onSelectBook?: (id: number) => void;
    onAddToCart?: (id: number) => void;
    className?: string;
}

export const BookGrid: React.FC<BookGridProps> = ({
    books,
    totalCount,
    emptyMessage = 'Rất tiếc, không tìm thấy sản phẩm phù hợp với bộ lọc của bạn.',
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
                    Hiển thị <strong>{totalCount ?? books.length}</strong> sản phẩm phù hợp
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
                        {emptyMessage}
                    </div>
                )}
            </div>
        </section>
    );
};

export default BookGrid;

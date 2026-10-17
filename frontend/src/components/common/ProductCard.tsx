import React from 'react';
import WishListButton from './WishListButton';
import StarRating from './StarRating';
import Badge from './Badge';
import BookCover from './BookCover';
import StockAvailabilityBadge from './StockAvailabilityBadge';
import styles from './ProductCard.module.css';
import type { ProductData } from '../../types/book';

export interface ProductCardProps {
    product: ProductData;
    isWishlisted?: boolean;
    onToggleWishlist?: (id: number) => void;
    onSelectBook?: (id: number) => void;
    onAddToCart?: (id: number) => void;
    showRemoveWishlistBtn?: boolean;
    onRemoveWishlist?: (id: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
    product,
    isWishlisted = false,
    onToggleWishlist,
    onSelectBook,
    onAddToCart,
    showRemoveWishlistBtn = false,
    onRemoveWishlist,
}) => {
    const displayPrice = product.isPhysicalAvailable ? product.physicalPrice : product.isEBookAvailable ? product.eBookPrice : product.weeklyRentalPrice;
    const activeWishlistState = product.isWishlisted ?? isWishlisted;

    return (
        <div className={styles.productCard} onClick={() => onSelectBook?.(product.id)}>
            <div className={styles.cardTopAction}>
                {showRemoveWishlistBtn ? (
                    <button
                        type="button"
                        className={styles.removeWishBtn}
                        title="Xóa khỏi yêu thích"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemoveWishlist?.(product.id);
                        }}
                    >
                        &times;
                    </button>
                ) : (
                    <WishListButton
                        isWishlisted={activeWishlistState}
                        onToggle={() => onToggleWishlist?.(product.id)}
                    />
                )}
            </div>

            <div className={styles.bookCoverWrap}>
                <BookCover src={product.coverImg} title={product.title} className={styles.bookCoverImg} />
            </div>

            {product.categories && product.categories.length > 0 && (
                <div className={styles.categoriesRow}>
                    {product.categories.slice(0, 2).map((cat, idx) => (
                        <span key={idx} className={styles.categoryChip}>
                            {cat}
                        </span>
                    ))}
                    {product.categories.length > 2 && (
                        <span className={styles.categoryChip} title={product.categories.slice(2).join(', ')}>
                            +{product.categories.length - 2}
                        </span>
                    )}
                </div>
            )}

            <div className={styles.formatBadges}>
                {product.isPhysicalAvailable && <Badge variant="stock_ok" text="Sách giấy" />}
                {product.isEBookAvailable && <Badge variant="ebook" text="E-Book" />}
                {product.isRentalAvailable && <Badge variant="rental" text="Thuê đọc" />}
            </div>

            <h4 className={styles.bookTitle}>{product.title}</h4>
            <p className={styles.bookAuthor}>{product.author}</p>

            {product.rating !== undefined && (
                <StarRating rating={product.rating} reviewsCount={product.reviewsCount} size="sm" />
            )}

            <StockAvailabilityBadge book={product} />

            <div className={styles.priceRow}>
                <span className={styles.salePrice}>{displayPrice.toLocaleString('vi-VN')} đ</span>
                {product.isRentalAvailable && product.weeklyRentalPrice !== undefined && (
                    <span className={styles.subPriceInfo}>
                        Thuê từ {product.weeklyRentalPrice.toLocaleString('vi-VN')} đ/tuần
                    </span>
                )}
            </div>

            <button
                type="button"
                className={styles.btnAddCartFast}
                disabled={product.status !== 'selling'}
                onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart?.(product.id);
                }}
            >
                {product.status === 'stopped' ? 'Ngừng kinh doanh' : product.status === 'upcoming' ? 'Sắp phát hành' : 'Thêm vào giỏ'}
            </button>
        </div>
    );
};

export default ProductCard;

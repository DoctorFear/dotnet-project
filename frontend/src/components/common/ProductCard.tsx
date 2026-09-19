import React from 'react';
import WishListButton from './WishListButton';
import StarRating from './StarRating';
import Badge from './Badge';
import styles from './ProductCard.module.css';
import type { ProductData } from '../../types/product';

export interface ProductCardProps {
    product: ProductData;
    isWishlisted?: boolean;
    onToggleWishlist?: (id: string) => void;
    onSelectBook?: (id: string) => void;
    onAddToCart?: (id: string) => void;
    showRemoveWishlistBtn?: boolean;
    onRemoveWishlist?: (id: string) => void;
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
    const displayPrice = product.physicalPrice ?? product.eBookPrice ?? product.weeklyRentalPrice ?? 0;
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
                <img src={product.coverImg} alt={product.title} className={styles.bookCoverImg} />
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

            {product.stockStatus === 'low_stock' && (
                <div>
                    <Badge variant="stock_warning" text={`Chỉ còn ${product.stockCount || 3} cuốn`} />
                </div>
            )}
            {product.stockStatus === 'in_stock' && (
                <div>
                    <Badge variant="stock_ok" text="Còn hàng" />
                </div>
            )}

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
                onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart?.(product.id);
                }}
            >
                Thêm vào giỏ
            </button>
        </div>
    );
};

export default ProductCard;
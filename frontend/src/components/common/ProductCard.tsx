import React from 'react';
import WishListButton from './WishListButton';
import StarRating from './StarRating';
import Badge from './Badge';
import BookCover from './BookCover';
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
    // Chỉ tính là khả dụng (màu xanh) khi hình thức được bật và thỏa điều kiện tồn kho / ấn bản xuất bản
    const isPhysicalInStock = (product.stockCount ?? 0) > 0;
    const hasPhysical = product.isPhysicalAvailable && isPhysicalInStock;
    const hasPublishedEbook = Boolean(product.hasPublishedEbook);
    const rentalPrices = [
        product.weeklyRentalPrice ?? 0,
        product.monthlyRentalPrice ?? 0,
        product.yearlyRentalPrice ?? 0,
    ].filter((price) => price > 0);
    const minRentalPrice = rentalPrices.length > 0 ? Math.min(...rentalPrices) : 0;
    const hasEBook = product.isEBookAvailable && hasPublishedEbook;
    const hasRental = product.isRentalAvailable && rentalPrices.length > 0 && hasPublishedEbook;
    const hasAnyActiveFormat = hasPhysical || hasEBook || hasRental;

    const displayPrice = hasPhysical
        ? product.physicalPrice
        : hasEBook
        ? product.eBookPrice
        : hasRental
        ? minRentalPrice
        : product.isPhysicalAvailable
        ? product.physicalPrice
        : product.isEBookAvailable
        ? product.eBookPrice
        : minRentalPrice;
    const activeWishlistState = product.isWishlisted ?? isWishlisted;

    // Phân định rõ ràng:
    // 1. Ngừng kinh doanh: Staff chủ động đặt stopped
    const isStopped = product.status === 'stopped';
    // 2. Sắp phát hành: Staff chủ động đặt upcoming
    const isUpcoming = product.status === 'upcoming';
    // 3. Tạm hết hàng: Staff đặt selling nhưng không còn hình thức nào mua được (hết sách giấy và không có digital)
    const isOutOfStock = product.status === 'selling' && !hasAnyActiveFormat;
    const isActionDisabled = isStopped || isUpcoming || isOutOfStock;

    const buttonLabel = isStopped
        ? 'Ngừng kinh doanh'
        : isUpcoming
        ? 'Sắp phát hành'
        : isOutOfStock
        ? 'Tạm hết hàng'
        : 'Thêm vào giỏ';

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

            {/* Chỉ hiển thị các hình thức thực sự mua được khi đang bán. Nếu Ngừng kinh doanh, Sắp phát hành hoặc Tạm hết hàng thì không hiển thị badge */}
            {!isStopped && !isUpcoming && !isOutOfStock && (
                <div className={styles.formatBadges}>
                    {hasPhysical && <Badge variant="stock_ok" text="Sách giấy" />}
                    {hasEBook && <Badge variant="ebook" text="E-Book" />}
                    {hasRental && <Badge variant="rental" text="Thuê đọc" />}
                </div>
            )}

            <h4 className={styles.bookTitle}>{product.title}</h4>
            <p className={styles.bookAuthor}>{product.author}</p>

            {product.rating !== undefined && (
                <StarRating rating={product.rating} reviewsCount={product.reviewsCount} size="sm" />
            )}

            <div className={styles.priceRow}>
                <span className={styles.salePrice}>{displayPrice.toLocaleString('vi-VN')} đ</span>
                {hasRental && minRentalPrice > 0 && !isStopped && !isUpcoming && !isOutOfStock && (
                    <span className={styles.subPriceInfo}>
                        {(product.weeklyRentalPrice ?? 0) > 0
                            ? `Thuê từ ${product.weeklyRentalPrice.toLocaleString('vi-VN')} đ/tuần`
                            : `Thuê từ ${minRentalPrice.toLocaleString('vi-VN')} đ`}
                    </span>
                )}
            </div>

            <button
                type="button"
                className={styles.btnAddCartFast}
                disabled={isActionDisabled}
                onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart?.(product.id);
                }}
            >
                {buttonLabel}
            </button>
        </div>
    );
};

export default ProductCard;

import React from 'react';
import styles from './CartItem.module.css';
import type { CartItemDto } from '../../types/cartItems';
import { X } from 'lucide-react';

export const CartItemCard: React.FC<CartItemDto> = ({
    item,
    onSelect,
    onFormatChange,
    onDurationChange,
    onQtyChange,
    onRemove
}) => {
    return (
        <div className={styles.cartItemRow}>
            <input
                type="checkbox"
                className={styles.cartItemCheckbox}
                checked={item.isSelected}
                onChange={(e) => onSelect(item.cartItemId, e.target.checked)}
            />
            <img src={item.coverImg} className={styles.cartItemImg} alt={item.title} />

            <div className={styles.cartItemDetails}>
                <h4 className={styles.cartItemTitle}>{item.title}</h4>
                <p className={styles.cartItemAuthor}>Tác giả: {item.author}</p>
                <div className={styles.cartItemPriceSet}>
                    <span className={styles.itemSalePrice}>{item.unitPrice?.toLocaleString()} đ</span>
                    {item.purchaseType === 2 && (
                        <span className={styles.rentalLabel}>
                            / {item.rentalDuration === 1 ? 'Tuần' : item.rentalDuration === 2 ? 'Tháng' : 'Năm'}
                        </span>
                    )}
                </div>
            </div>

            <div className={styles.cartItemActions}>
                <select
                    className={styles.formatSelect}
                    value={item.purchaseType}
                    onChange={(e) => onFormatChange(item.cartItemId, Number(e.target.value))}
                >
                    <option value={1}>Sách Giấy</option>
                    <option value={3} disabled>E-Book Online</option>
                    <option value={2}>Thuê Đọc</option>
                </select>

                <div className={styles.dynamicControlWrapper}>
                    {item.purchaseType === 1 && (
                        <div className={styles.qtySelector}>
                            <button type="button" className={styles.qtyBtn} onClick={() => onQtyChange(item.cartItemId, -1)}>-</button>
                            <input type="text" className={styles.qtyInput} value={item.quantity} readOnly />
                            <button type="button" className={styles.qtyBtn} onClick={() => onQtyChange(item.cartItemId, 1)}>+</button>
                        </div>
                    )}

                    {item.purchaseType === 2 && (
                        <select
                            className={styles.durationSelect}
                            value={item.rentalDuration || 1}
                            onChange={(e) => onDurationChange(item.cartItemId, Number(e.target.value))}
                        >
                            <option value={1}>Gói 1 Tuần</option>
                            <option value={2}>Gói 1 Tháng</option>
                            <option value={3}>Gói 1 Năm</option>
                        </select>
                    )}
                </div>
            </div>

            <button type="button" className={styles.btnRemoveItem} onClick={() => onRemove(item.cartItemId)}>
                <X />
            </button>
        </div>
    );
};
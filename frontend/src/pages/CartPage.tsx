import React, { useState } from 'react';
import styles from './CartPage.module.css';
import type { CartItem } from '../types/cartItems';
import TopBar from '../components/layout/TopBar';
import Header from '../components/layout/Header';

export const CartPage: React.FC = () => {
    const [items, setItems] = useState<CartItem[]>([
        {
        id: 1,
        title: 'Số Đỏ (Tái bản khổ lớn nghệ thuật)',
        author: 'Vũ Trọng Phụng',
        price: 85000,
        origPrice: 110000,
        img: 'https://salt.tikicdn.com/ts/product/45/3e/2e/9f992ab2a5436d4f937d9fae16d47b53.jpg',
        qty: 1,
        selected: true,
        },
        {
        id: 2,
        title: 'Tội Lỗi Và Hình Phạt (Tập 1)',
        author: 'Fyodor Dostoevsky',
        price: 145000,
        origPrice: 180000,
        img: 'https://salt.tikicdn.com/ts/product/19/22/e0/aa29986348ef0eeab07ff83f99e3cae6.jpg',
        qty: 1,
        selected: true,
        },
        {
        id: 3,
        title: 'Vụ Án Mạng Trên Chuyến Tàu Tốc Hành Phương Đông',
        author: 'Agatha Christie',
        price: 98000,
        origPrice: 120000,
        img: 'https://nhasachphuongnam.com/images/detailed/181/81yvSg0d7AL._AC_SL1500_.jpg',
        qty: 1,
        selected: true,
        },
    ]);

    const allSelected = items.length > 0 && items.every((item) => item.selected);

    const toggleSelectAll = () => {
        const nextState = !allSelected;
        setItems(items.map((i) => ({ ...i, selected: nextState })));
    };

    const toggleSelectItem = (id: number) => {
        setItems(items.map((i) => (i.id === id ? { ...i, selected: !i.selected } : i)));
    };

    const adjustQty = (id: number, delta: number) => {
        setItems(
        items.map((i) => {
            if (i.id === id) {
            const newQty = i.qty + delta;
            return { ...i, qty: newQty < 1 ? 1 : newQty };
            }
            return i;
        })
        );
    };

    const removeItem = (id: number) => {
        setItems(items.filter((i) => i.id !== id));
    };

    const selectedItems = items.filter((i) => i.selected);
    const totalPrice = selectedItems.reduce((sum, i) => sum + i.price * i.qty, 0);

    return (
        <div className={styles.cartBody}>
        <TopBar />
        <Header />

        {/* Main Container */}
        <main className={styles.cartPageContainer}>
            <a href="#home" className={styles.backToShop}>
            <span>← Tiếp tục mua sắm sách khác</span>
            </a>

            <section className={styles.cartMainBox}>
            <div className={styles.cartBoxHeader}>
                <label className={styles.selectAllLabel}>
                <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    disabled={items.length === 0}
                />
                <span>Chọn tất cả sản phẩm ({items.length} cuốn)</span>
                </label>
                <span style={{ fontSize: '12px', color: '#5b6e99' }}>Đơn giá & Tùy chọn</span>
            </div>

            <div className={styles.cartItemsList}>
                {items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: '#5b6e99' }}>
                    Giỏ hàng của bạn đang trống!
                </div>
                ) : (
                items.map((item) => (
                    <div className={styles.cartItemRow} key={item.id}>
                    <input
                        type="checkbox"
                        className={styles.cartItemCheckbox}
                        checked={item.selected}
                        onChange={() => toggleSelectItem(item.id)}
                    />
                    <img src={item.img} className={styles.cartItemImg} alt={item.title} />
                    <div className={styles.cartItemDetails}>
                        <h4 className={styles.cartItemTitle}>{item.title}</h4>
                        <p className={styles.cartItemAuthor}>Tác giả: {item.author}</p>
                        <div className={styles.cartItemPriceSet}>
                        <span className={styles.itemSalePrice}>{item.price.toLocaleString()} đ</span>
                        <span className={styles.itemOrigPrice}>{item.origPrice.toLocaleString()} đ</span>
                        </div>
                    </div>
                    <div className={styles.cartItemActions}>
                        <div className={styles.qtySelector}>
                        <button type="button" className={styles.qtyBtn} onClick={() => adjustQty(item.id, -1)}>-</button>
                        <input type="text" className={styles.qtyInput} value={item.qty} readOnly />
                        <button type="button" className={styles.qtyBtn} onClick={() => adjustQty(item.id, 1)}>+</button>
                        </div>
                        <button type="button" className={styles.btnRemoveItem} onClick={() => removeItem(item.id)}>
                        ✕
                        </button>
                    </div>
                    </div>
                ))
                )}
            </div>
            </section>

            {/* Footer Summary */}
            <section className={styles.cartSummaryFooter}>
            <div className={styles.summaryLeftInfo}>
                <span>Đã chọn <strong>{selectedItems.length}</strong> sản phẩm thanh toán</span>
                <div>Tổng tiền tạm tính: <strong>{totalPrice.toLocaleString()} đ</strong></div>
            </div>
            <button
                className={`${styles.btnProceedCheckout} ${selectedItems.length === 0 ? styles.disabled : ''}`}
                disabled={selectedItems.length === 0}
            >
                Tiến hành đặt mua ({selectedItems.length} sản phẩm)
            </button>
            </section>
        </main>
        </div>
    );
};
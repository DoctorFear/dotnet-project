import React from 'react';
import styles from './CartPage.module.css';
import { useCartData } from '../hooks/useBookCartAction';
import TopBar from '../components/layout/TopBar';
import Header from '../components/layout/Header';
import { CartItemCard } from '../components/common/CartItemCard';
import { MoveLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { updateCart } from '../services/bookCartService';

export const CartPage: React.FC = () => {
    const { items, setItems, loading, error, updateItemQty, removeCartItem } = useCartData();

    const allSelected = items.length > 0 && items.every((item) => item.isSelected);

    const navigate = useNavigate();

    // Cập nhật cài đặt hoặc số lượng của một sản phẩm trong giỏ hàng
    const updateItemSettings = async (
        id: number,
        updates: { quantity?: number; purchaseType?: number; rentalDuration?: number | null, isSelected?: boolean }
    ) => {
        const item = items.find((i) => i.cartItemId === id);
        if (!item) return;

        const newQty = updates.quantity !== undefined ? updates.quantity : item.quantity;
        const newType = updates.purchaseType !== undefined ? updates.purchaseType : item.purchaseType;
        const newSelected = updates.isSelected !== undefined ? updates.isSelected : item.isSelected;
        
        let newDuration = item.rentalDuration;
        if (newType === 2) {
            newDuration = updates.rentalDuration !== undefined ? updates.rentalDuration : (item.rentalDuration || 1);
        } else {
            newDuration = null;
        }

        if (newQty < 1 && newType === 1) return;

        const effectiveQty = (newType === 2 || newType === 3) ? 1 : newQty;

        setItems(
            items.map((i) =>
                i.cartItemId === id
                    ? { ...i, quantity: effectiveQty, purchaseType: newType, rentalDuration: newDuration, isSelected: newSelected }
                    : i
            )
        );

        try {
            await updateItemQty(id, effectiveQty, newType, newDuration, newSelected);
        } catch (e) {}
    };

    // Chọn hoặc bỏ chọn tất cả sản phẩm trong giỏ hàng
    const toggleSelectAll = async () => {
        const nextState = !allSelected;
        setItems((prev) => prev.map((i) => ({ ...i, isSelected: nextState })));
        try {
            await Promise.all(
                items.map((i) =>
                    updateCart(i.cartItemId, {
                        quantity: i.quantity,
                        purchaseType: i.purchaseType,
                        rentalDuration: i.rentalDuration,
                        isSelected: nextState,
                    })
                )
            );
        } catch (e) {
            console.error(e);
        }
    };

    // Chọn hoặc bỏ chọn một sản phẩm trong giỏ hàng
    const toggleSelectItem = (id: number, isSelected: boolean) => {
        const item = items.find((i) => i.cartItemId === id);
        if (item) updateItemSettings(id, { isSelected });
    };

    const adjustQty = (id: number, delta: number) => {
        const item = items.find((i) => i.cartItemId === id);
        if (item) updateItemSettings(id, { quantity: item.quantity + delta });
    };

    const handleFormatChange = (id: number, type: number) => {
        updateItemSettings(id, { purchaseType: type });
    };

    const handleDurationChange = (id: number, duration: number) => {
        updateItemSettings(id, { rentalDuration: duration });
    };

    const removeItem = async (id: number) => {
        setItems(items.filter((i) => i.cartItemId !== id));
        try {
            await removeCartItem(id);
        } catch (e) {
           console.error(e)
        }
    };

    const handleCheckout = () => {
        const selectedItems = items.filter((i) => i.isSelected);
        if (selectedItems.length > 0) navigate('/checkout', { state: { selectedItems } });
    }

    const selectedItems = items.filter((i) => i.isSelected);
    const totalPrice = selectedItems.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);

    if (loading) return <div style={{ textAlign: 'center', padding: '24px' }}>Đang tải giỏ hàng...</div>;
    if (error) return <div style={{ textAlign: 'center', color: 'red', padding: '24px' }}>{error}</div>;

    return (
        <div className={styles.cartBody}>
            <TopBar />
            <Header />

            {/* Main Container */}
            <main className={styles.cartPageContainer}>
                <a href="/" onClick={() => {navigate("/");}} className={styles.backToShop}>
                    <MoveLeft width={10} height={10} />
                    <span>Tiếp tục mua sắm sách khác</span>
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
                        <CartItemCard 
                            key={item.cartItemId}
                            item={item}
                            onSelect={toggleSelectItem}
                            onFormatChange={handleFormatChange}
                            onDurationChange={handleDurationChange}
                            onQtyChange={adjustQty}
                            onRemove={removeItem}
                        />
                    ))
                    )}
                </div>
                </section>

                <section className={styles.cartSummaryFooter}>
                <div className={styles.summaryLeftInfo}>
                    <span>Đã chọn <strong>{selectedItems.length}</strong> sản phẩm thanh toán</span>
                    <div>Tổng tiền tạm tính: <strong>{totalPrice.toLocaleString()} đ</strong></div>
                </div>
                <button
                    className={`${styles.btnProceedCheckout} ${selectedItems.length === 0 ? styles.disabled : ''}`}
                    disabled={selectedItems.length === 0}
                    onClick={handleCheckout}
                >
                    Tiến hành đặt mua ({selectedItems.length} sản phẩm)
                </button>
                </section>
            </main>
        </div>
    );
};
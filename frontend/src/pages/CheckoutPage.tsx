import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './CheckoutPage.module.css';
import TopBar from '../components/layout/TopBar';
import Header from '../components/layout/Header';
import { useCheckout } from '../hooks/useCheckout';

export const CheckoutPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const cartItems = location.state?.selectedItems || [];

    const {
        addresses,
        selectedAddrId,
        setSelectedAddrId,
        paymentMethod,
        setPaymentMethod,
        pointsUsed,
        userMaxPoints,
        handlePointsChange,
        shippingFee,
        subTotal,
        discountVal,
        finalTotal,
        isProcessing,
        isSuccessModalOpen,
        setIsSuccessModalOpen,
        orderCode,
        submitCheckout
    } = useCheckout(cartItems);

    useEffect(() => {
        if (cartItems.length === 0) {
            navigate('/cart');
        }
    }, [cartItems, navigate]);

    return (
        <div className={styles.checkoutBody}>
            <TopBar />
            <Header />

            <main className={styles.checkoutContainer}>
                <div className={styles.checkoutLeftColumn}>
                    <a href="/cart" onClick={(e) => { e.preventDefault(); navigate('/cart'); }} className={styles.backToShop}>
                        ← Quay lại Giỏ hàng
                    </a>

                    <section className={styles.checkoutCard}>
                        <div className={styles.checkoutCardTitle}>
                            <span>Thông tin người nhận sách</span>
                        </div>

                        <div className={styles.addressOptionsList}>
                            {addresses.map((addr) => (
                                <label key={addr.id} className={`${styles.addressCardItem} ${selectedAddrId === addr.id ? styles.active : ''}`}>
                                    <input type="radio" checked={selectedAddrId === addr.id} onChange={() => setSelectedAddrId(addr.id)} />
                                    <div className={styles.addressCardContent}>
                                        <div className={styles.addressCardHeader}>
                                            <strong>{addr.name}</strong>
                                        </div>
                                        <p className={styles.addressPhone}>{addr.phone}</p>
                                        <p className={styles.addressText}>{addr.address}</p>
                                    </div>
                                </label>
                            ))}
                        </div>

                        <div className={styles.checkoutCardTitle} style={{ marginTop: '24px' }}>
                            <span>Danh sách sản phẩm trong đơn</span>
                        </div>

                        <div className={styles.cartItemsFullList}>
                            {cartItems.map((item: any) => (
                                <div key={item.cartItemId} className={styles.cartItemCard}>
                                    <img src={item.coverImg} className={styles.cartItemImg} alt={item.title} />
                                    <div className={styles.cartItemInfo}>
                                        <h4 className={styles.cartItemTitle}>{item.title}</h4>
                                        <div className={styles.cartItemQtyPrice}>
                                            <span>Số lượng: <strong>{item.quantity}</strong></span>
                                            <strong style={{ color: '#0B409C' }}>{item.unitPrice?.toLocaleString()} đ</strong>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <div className={styles.checkoutRightColumn}>
                    <section className={styles.checkoutCard}>
                        <div className={styles.checkoutCardTitle}><span>Phương thức thanh toán</span></div>
                        <div className={styles.paymentOptionsList}>
                            <label className={styles.paymentOptionItem}>
                                <input type="radio" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                                <div><h4>Thanh toán khi nhận hàng (COD)</h4></div>
                            </label>
                            <label className={styles.paymentOptionItem}>
                                <input type="radio" value="momo" checked={paymentMethod === 'momo'} onChange={() => setPaymentMethod('momo')} />
                                <div><h4>Ví điện tử MoMo</h4></div>
                            </label>
                        </div>

                        <div className={styles.checkoutCardTitle} style={{ fontSize: '14px', marginTop: '20px' }}>
                            <span>Sử dụng điểm F-Points</span>
                        </div>
                        <div className={styles.voucherBox} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <input
                                type="number"
                                min="0"
                                max={userMaxPoints}
                                step={10}
                                className={styles.voucherInput}
                                value={pointsUsed || ''}
                                onChange={(e) => handlePointsChange(parseInt(e.target.value) || 0)}
                                placeholder="Nhập số điểm..."
                                disabled={isProcessing}
                            />
                            <span style={{ fontSize: '13px', color: '#5b6e99', flexShrink: 0 }}>/ {userMaxPoints} điểm</span>
                        </div>
                        {pointsUsed > 0 && (
                            <div style={{ fontSize: '11.5px', marginBottom: '14px', color: '#15803d' }}>
                                ✔ Đã quy đổi {pointsUsed} điểm thành -{(discountVal).toLocaleString()} đ
                            </div>
                        )}

                        <div className={styles.calcRow} style={{ marginTop: '20px' }}>
                            <span>Tạm tính tiền sách:</span>
                            <strong>{subTotal.toLocaleString()} đ</strong>
                        </div>
                        <div className={styles.calcRow}>
                            <span>Phí vận chuyển:</span>
                            <strong>{shippingFee.toLocaleString()} đ</strong>
                        </div>
                        {discountVal > 0 && (
                            <div className={styles.calcRow} style={{ color: '#15803d' }}>
                                <span>Giảm giá (F-Points):</span>
                                <strong>- {discountVal.toLocaleString()} đ</strong>
                            </div>
                        )}
                        <div className={`${styles.calcRow} ${styles.total}`}>
                            <span>Tổng cộng:</span>
                            <span className={styles.totalPriceVal}>{finalTotal.toLocaleString()} đ</span>
                        </div>

                        <button 
                            type="button" 
                            className={styles.btnCompleteOrder} 
                            onClick={() => submitCheckout(1)}
                            disabled={isProcessing}
                        >
                            {isProcessing ? 'Đang xử lý...' : 'Đặt mua đơn hàng ngay'}
                        </button>
                    </section>
                </div>
            </main>

            {isSuccessModalOpen && (
                <div className={styles.successModalOverlay} style={{ display: 'flex' }}>
                    <div className={styles.successModalBox}>
                        <h3>Đặt hàng thành công!</h3>
                        <p>Mã đơn hàng của bạn là <strong style={{ color: '#0B409C' }}>#{orderCode}</strong>.</p>
                        <button className={styles.btnCloseSuccess} onClick={() => { setIsSuccessModalOpen(false); navigate('/'); }}>
                            Quay lại trang chủ
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
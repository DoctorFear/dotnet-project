import React, { useState } from 'react';
import styles from './CheckoutPage.module.css';
import type { Address } from '../types/address';
import TopBar from '../components/layout/TopBar';
import Header from '../components/layout/Header';

export const CheckoutPage: React.FC = () => {
    const [addresses, setAddresses] = useState<Address[]>([
        {
        id: 1,
        name: 'Thanh Sang',
        phone: '0912345678',
        email: 'thansang@dev.com',
        address: '128 Nguyễn Thị Minh Khai, Quận 1, TP. Hồ Chí Minh',
        isDefault: true,
        },
        {
        id: 2,
        name: 'Thanh Sang (Văn phòng công ty)',
        phone: '0988765432',
        email: 'thansang@dev.com',
        address: 'Khu Công Nghệ, Phường Tân Phú, Thành phố Thủ Đức, TP. Hồ Chí Minh',
        isDefault: false,
        },
    ]);

    const [selectedAddrId, setSelectedAddrId] = useState<number>(1);
    const [paymentMethod, setPaymentMethod] = useState<string>('cod');
    const [voucherCode, setVoucherCode] = useState<string>('');
    const [discountVal, setDiscountVal] = useState<number>(0);
    const [shippingFee, setShippingFee] = useState<number>(15000);
    const [voucherMsg, setVoucherMsg] = useState<{ text: string; success: boolean } | null>(null);

    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
    const [orderCode, setOrderCode] = useState<string>('');

    const [isAddressModalOpen, setIsAddressModalOpen] = useState<boolean>(false);
    const [editingAddr, setEditingAddr] = useState<Partial<Address>>({});

    const subTotal = 230000;
    const finalTotal = subTotal + shippingFee - discountVal;

    const handleApplyVoucher = () => {
        const code = voucherCode.trim().toUpperCase();
        if (code === 'ANCIENT20') {
        setDiscountVal(20000);
        setVoucherMsg({ text: '✔ Áp dụng mã giảm giá thành công (-20.000 đ)', success: true });
        } else if (code === 'FREESHIP') {
        setShippingFee(0);
        setVoucherMsg({ text: '✔ Miễn phí vận chuyển thành công!', success: true });
        } else {
        setDiscountVal(0);
        setVoucherMsg({ text: '✖ Mã giảm giá không tồn tại hoặc đã hết hạn.', success: false });
        }
    };

    const handleCompleteOrder = () => {
        const randomId = '#AB' + Math.floor(1000 + Math.random() * 9000);
        setOrderCode(randomId);
        setIsSuccessModalOpen(true);
    };

    const saveModalAddress = () => {
        if (!editingAddr.name || !editingAddr.phone || !editingAddr.address) {
        alert('Vui lòng điền đầy đủ thông tin!');
        return;
        }

        if (editingAddr.id) {
        setAddresses(
            addresses.map((a) => (a.id === editingAddr.id ? ({ ...a, ...editingAddr } as Address) : a))
        );
        } else {
        const newEntry: Address = {
            id: Date.now(),
            name: editingAddr.name!,
            phone: editingAddr.phone!,
            email: editingAddr.email || '',
            address: editingAddr.address!,
            isDefault: false,
        };
        setAddresses([...addresses, newEntry]);
        }
        setIsAddressModalOpen(false);
    };

    return (
        <div className={styles.checkoutBody}>
            <TopBar />
            <Header />

            {/* Main Checkout Grid */}
            <main className={styles.checkoutContainer}>
                <div className={styles.checkoutLeftColumn}>
                <a href="#home" className={styles.backToShop}>← Quay lại trang cửa hàng</a>

                <section className={styles.checkoutCard}>
                    <div className={styles.checkoutCardTitle}>
                    <span>Thông tin người nhận sách</span>
                    <span style={{ fontSize: '11.5px', color: '#15803d' }}>Đã có thông tin</span>
                    </div>

                    <div className={styles.addressOptionsList}>
                    {addresses.map((addr) => (
                        <label
                        key={addr.id}
                        className={`${styles.addressCardItem} ${selectedAddrId === addr.id ? styles.active : ''}`}
                        >
                        <input
                            type="radio"
                            name="selectedAddress"
                            checked={selectedAddrId === addr.id}
                            onChange={() => setSelectedAddrId(addr.id)}
                        />
                        <div className={styles.addressCardContent}>
                            <div className={styles.addressCardHeader}>
                            <strong>{addr.name}</strong>
                            {addr.isDefault && <span className={styles.defaultBadge}>Mặc định</span>}
                            </div>
                            <p className={styles.addressPhone}>{addr.phone} • {addr.email}</p>
                            <p className={styles.addressText}>{addr.address}</p>
                        </div>
                        <button
                            type="button"
                            className={styles.btnIconEdit}
                            onClick={(e) => {
                            e.preventDefault();
                            setEditingAddr(addr);
                            setIsAddressModalOpen(true);
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil preview-icon"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>
                        </button>
                        </label>
                    ))}
                    </div>

                    <div className={styles.checkoutCardTitle} style={{ marginTop: '24px' }}>
                    <span>Danh sách sản phẩm trong đơn</span>
                    </div>

                    <div className={styles.cartItemsFullList}>
                    <div className={styles.cartItemCard}>
                        <img src="https://salt.tikicdn.com/ts/product/45/3e/2e/9f992ab2a5436d4f937d9fae16d47b53.jpg" className={styles.cartItemImg} alt="book" />
                        <div className={styles.cartItemInfo}>
                        <h4 className={styles.cartItemTitle}>Số Đỏ (Tái bản khổ lớn nghệ thuật)</h4>
                        <p className={styles.cartItemAuthor}>Tác giả: Vũ Trọng Phụng</p>
                        <div className={styles.cartItemQtyPrice}>
                            <span>Số lượng: <strong>1</strong></span>
                            <strong style={{ color: '#0B409C' }}>85.000 đ</strong>
                        </div>
                        </div>
                    </div>
                    </div>
                </section>
                </div>

                {/* Right Column: Payment & Totals */}
                <div className={styles.checkoutRightColumn}>
                <section className={styles.checkoutCard}>
                    <div className={styles.checkoutCardTitle}><span>Phương thức thanh toán</span></div>

                    <div className={styles.paymentOptionsList}>
                    <label className={styles.paymentOptionItem}>
                        <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                        />
                        <div className={styles.paymentDetailsText}>
                        <h4>Thanh toán khi nhận hàng (COD)</h4>
                        <p>Thanh toán bằng tiền mặt trực tiếp.</p>
                        </div>
                    </label>

                    <label className={styles.paymentOptionItem}>
                        <input
                        type="radio"
                        name="paymentMethod"
                        value="momo"
                        checked={paymentMethod === 'momo'}
                        onChange={() => setPaymentMethod('momo')}
                        />
                        <div className={styles.paymentDetailsText}>
                        <h4>Ví điện tử MoMo</h4>
                        <p>Mở ứng dụng ví điện tử để thanh toán.</p>
                        </div>
                    </label>
                    </div>

                    <div className={styles.checkoutCardTitle} style={{ fontSize: '14px' }}><span>Mã giảm giá / Voucher</span></div>
                    <div className={styles.voucherBox}>
                    <input
                        type="text"
                        className={styles.voucherInput}
                        placeholder="Nhập mã (VD: ANCIENT20)..."
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value)}
                    />
                    <button type="button" className={styles.voucherBtn} onClick={handleApplyVoucher}>Áp dụng</button>
                    </div>
                    {voucherMsg && (
                    <div style={{ fontSize: '11.5px', marginBottom: '14px', color: voucherMsg.success ? '#15803d' : '#d93838' }}>
                        {voucherMsg.text}
                    </div>
                    )}

                    <div className={styles.calcRow}>
                    <span>Tạm tính tiền sách:</span>
                    <strong>{subTotal.toLocaleString()} đ</strong>
                    </div>
                    <div className={styles.calcRow}>
                    <span>Phí vận chuyển:</span>
                    <strong>{shippingFee === 0 ? 'Miễn phí' : `${shippingFee.toLocaleString()} đ`}</strong>
                    </div>
                    {discountVal > 0 && (
                    <div className={styles.calcRow} style={{ color: '#15803d' }}>
                        <span>Giảm giá:</span>
                        <strong>- {discountVal.toLocaleString()} đ</strong>
                    </div>
                    )}
                    <div className={`${styles.calcRow} ${styles.total}`}>
                    <span>Tổng cộng:</span>
                    <span className={styles.totalPriceVal}>{finalTotal.toLocaleString()} đ</span>
                    </div>

                    <button type="button" className={styles.btnCompleteOrder} onClick={handleCompleteOrder}>
                    Đặt mua đơn hàng ngay
                    </button>
                </section>
                </div>
            </main>

            {/* Success Modal */}
            {isSuccessModalOpen && (
                <div className={styles.successModalOverlay} style={{ display: 'flex' }}>
                <div className={styles.successModalBox}>
                    <h3>Đặt hàng thành công!</h3>
                    <p>Mã đơn hàng của bạn là <strong style={{ color: '#0B409C' }}>{orderCode}</strong>.</p>
                    <button className={styles.btnCloseSuccess} onClick={() => setIsSuccessModalOpen(false)}>Quay lại trang chủ</button>
                </div>
                </div>
            )}
        </div>
    );
};
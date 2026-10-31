// src/pages/SePayPaymentPage.tsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './CheckoutPage.module.css';

export const SePayPaymentPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state as { orderId: number; amount: number; qrUrl: string } | null;

    const [isPaid, setIsPaid] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

    useEffect(() => {
        if (!state?.qrUrl) {
            navigate('/cart'); 
            return;
        }

        const interval = setInterval(async () => {
            try {
                const response = await fetch(`/api/checkout/${state.orderId}/is-paid`);
                const data = await response.json();
                
                if (data.isPaid) {
                    setIsPaid(true);
                    setIsSuccessModalOpen(true);
                    clearInterval(interval);
                }
            } catch (error) {
                console.error("Lỗi khi kiểm tra trạng thái thanh toán:", error);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [state, navigate]);

    if (!state) return null;

    return (
        <div className={styles.checkoutBody} style={{ justifyContent: 'center', alignItems: 'center' }}>
            <div className={styles.checkoutCard} style={{ display: 'flex', flexDirection: 'row', maxWidth: '800px', width: '100%', padding: '0', overflow: 'hidden' }}>
                
                <div style={{ flex: '1', padding: '32px', display: 'flex', flexDirection: 'column' }}>
                    <div className={styles.checkoutCardTitle} style={{ borderBottom: 'none', marginBottom: '8px' }}>
                        <span style={{ fontSize: '20px' }}>Thông tin đơn hàng</span>
                    </div>
                    
                    <div className={styles.calcRow} style={{ borderBottom: '1px solid var(--hairline)', paddingBottom: '12px', marginTop: '16px' }}>
                        <span style={{ color: 'var(--muted)' }}>Nhà cung cấp</span>
                        <strong style={{ color: 'var(--catalina)' }}>AncientBook</strong>
                    </div>
                    
                    <div className={styles.calcRow} style={{ borderBottom: '1px solid var(--hairline)', paddingBottom: '12px', marginTop: '12px' }}>
                        <span style={{ color: 'var(--muted)' }}>Mã đơn hàng</span>
                        <strong style={{ color: 'var(--catalina)' }}>#{state.orderId}</strong>
                    </div>
                    
                    <div className={styles.calcRow} style={{ borderBottom: '1px solid var(--hairline)', paddingBottom: '12px', marginTop: '12px' }}>
                        <span style={{ color: 'var(--muted)' }}>Nội dung CK</span>
                        <strong style={{ color: 'var(--catalina)' }}>AB{state.orderId}</strong>
                    </div>
                    
                    <div className={styles.calcRow} style={{ marginTop: '16px', alignItems: 'center' }}>
                        <span style={{ color: 'var(--muted)' }}>Số tiền</span>
                        <strong style={{ color: 'var(--egyptian)', fontSize: '24px' }}>
                            {state.amount.toLocaleString('vi-VN')}đ
                        </strong>
                    </div>

                    <button 
                        className={styles.backToShopPay} 
                        style={{ marginTop: 'auto', justifyContent: 'center' }}
                        onClick={() => navigate('/')}
                    >
                        ← Quay về trang chủ
                    </button>
                </div>

                <div style={{ flex: '1.2', background: 'var(--catalina)', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'var(--white)', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
                        <img src={state.qrUrl} alt="SePay QR Code" style={{ width: '220px', height: '220px', objectFit: 'contain' }} />
                    </div>
                    <div style={{ textAlign: 'center', color: 'var(--white)' }}>
                        <p style={{ marginBottom: '8px', fontSize: '15px' }}>
                            Sử dụng <strong>App Ngân hàng</strong> để quét mã
                        </p>
                        <p style={{ fontSize: '13px', opacity: 0.8, lineHeight: '1.4' }}>
                            Đơn hàng sẽ được tự động xử lý ngay sau khi bạn thanh toán thành công.
                        </p>
                    </div>
                </div>
            </div>

            {isSuccessModalOpen && (
                <div className={styles.successModalOverlay} style={{ display: 'flex' }}>
                    <div className={styles.successModalBox}>
                        <h3>Thanh toán thành công!</h3>
                        <p>Cảm ơn bạn. Đơn hàng <strong style={{ color: 'var(--egyptian)' }}>#{state.orderId}</strong> đã được ghi nhận thanh toán.</p>
                        <button className={styles.btnCloseSuccess} onClick={() => { setIsSuccessModalOpen(false); navigate('/'); }}>
                            Trở về trang chủ
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
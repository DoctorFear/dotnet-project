import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import TopBar from '../components/layout/TopBar';
import Header from '../components/layout/Header';
import Navbar from '../components/layout/Navbar';
import Breadcrumb from '../components/common/Breadcrumb';
import { getOrderDetail } from '../services/orderService';
import { presentOrder } from '../services/orderHistoryService';
import OrderHistoryActions, { OrderHistoryNotes } from '../components/features/order-history/OrderHistoryActions';
import { OrderHistoryItem, OrderPoints, OrderProgress } from '../components/features/order-history/OrderHistoryCard';
import { orderStatusLabels, purchaseType } from '../utils/orderHistory';
import { type Order, OrderStatus } from '../types/order';
import { MoveLeft, Calendar, MapPin, WalletCards } from 'lucide-react';
import styles from './OrderDetailPage.module.css';

export const OrderDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const returnPath = typeof location.state?.returnPath === 'string' && location.state.returnPath.startsWith('/order-history?') ? location.state.returnPath : '/order-history';
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => {
        let active = true;
        queueMicrotask(() => { if (active) { setIsLoading(true); setError(null); } });
        getOrderDetail(id ?? '').then(data => { if (active) setOrder(presentOrder(data)); })
            .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Không thể tải thông tin chi tiết đơn hàng.'); })
            .finally(() => { if (active) setIsLoading(false); });
        const update = () => setOrder(current => current ? presentOrder(current) : current);
        window.addEventListener('order-history-changed', update);
        return () => { active = false; window.removeEventListener('order-history-changed', update); };
    }, [id]);

    // Hàm hiển thị phân loại Sách Vật Lý (Số lượng) hoặc E-Book (Thời hạn thuê)
    const renderItems = (current: Order) => current.orderItems.map(item => <OrderHistoryItem key={item.id} order={current} item={item} detail />);
    // You can move this to your CSS modules
    const badge = order?.status === OrderStatus.Failed ? styles.badgeDanger : order?.status === OrderStatus.Returned ? styles.badgeReturned : order?.status === OrderStatus.Completed ? styles.badgeSuccess : order && [OrderStatus.Pending, OrderStatus.ReturnRequested].includes(order.status) ? styles.badgeWarning : styles.badgePrimary;

    if (isLoading) return <div className={styles.centerBox}>Đang tải chi tiết đơn hàng #{id}...</div>;
    if (error || !order) return <div className={styles.centerBox}><p>{error || 'Không tìm thấy đơn hàng.'}</p><button className={styles.btnBack} onClick={() => navigate(returnPath)}>Quay lại danh sách đơn hàng</button></div>;
    const payment = order.paymentMethod === 'COD' ? 'Thanh toán tiền mặt COD' : order.paymentMethod ?? 'Chưa cập nhật phương thức thanh toán';
    return <div className={styles.page}>
        <TopBar /><Header /><Navbar />
        <main className={styles.container}>
            <Breadcrumb items={[{ label: 'Trang chủ', link: '/' }, { label: 'Lịch sử đơn hàng', link: returnPath }, { label: `Chi tiết đơn hàng #${order.id}` }]} />
            <button type="button" className={styles.backLink} onClick={() => navigate(returnPath)}><MoveLeft size={16} /><span>Trở về danh sách đơn hàng</span></button>
            {/* Header Thông tin tổng quan đơn hàng */}
            <div className={styles.cardHeaderInfo}><div><h1 className={styles.orderTitle}>Mã đơn hàng: #{order.id}</h1><div className={styles.orderDateMeta}><Calendar size={15} /><span>Ngày đặt: {new Date(order.orderDate).toLocaleString('vi-VN')}</span></div></div><span className={`${styles.badge} ${badge}`}>{orderStatusLabels[order.status]}</span></div>
            {/* Grid 2 Cột: Danh sách Sản phẩm bên trái, Thông tin giao hàng & Thanh toán bên phải */}
            <div className={styles.detailGrid}>
                {/* Cột Trái: Danh sách Sản phẩm */}
                <section className={styles.productsPanel}>
                    <h2 className={styles.productsTitle}>Sản phẩm đã đặt ({order.orderItems.length})</h2>
                    {/* Hiển thị phân loại Vật lý (Số lượng) hoặc E-book (Thời hạn thuê) */}
                    {renderItems(order)}
                    <OrderProgress order={order} />
                    <OrderHistoryNotes order={order} />
                </section>
                {/* Cột Phải: Thông tin giao hàng & Tổng tiền */}
                <aside className={styles.sideCol}>
                    {/* Khối giao hàng & thanh toán */}
                    <section className={`${styles.cardPanel} ${styles.infoPanel}`}>
                        <h2 className={styles.infoHeading}><span className={styles.infoIcon}><MapPin size={18} /></span>Thông tin nhận hàng</h2>
                        {(order.user?.fullName || order.user?.phoneNumber) && <div className={styles.recipient}><strong>{order.user?.fullName}</strong>{order.user?.phoneNumber && <span>{order.user.phoneNumber}</span>}</div>}
                        <div className={styles.infoField}><span>Địa chỉ giao hàng</span><p>{order.shippingAddress || (order.orderItems.some(item => purchaseType(item) === 'physical') ? 'Chưa cập nhật địa chỉ giao hàng.' : 'Đơn sách online không yêu cầu giao hàng.')}</p></div>
                    </section>
                    <section className={`${styles.cardPanel} ${styles.infoPanel}`}>
                        <h2 className={styles.infoHeading}><span className={styles.infoIcon}><WalletCards size={18} /></span>Thanh toán</h2>
                        <div className={styles.paymentMethod}><span>Phương thức thanh toán</span><strong>{payment}</strong></div>
                        {order.paymentMethod === 'COD' && <p className={styles.paymentHint}>Thanh toán cho shipper khi nhận hàng.</p>}
                    </section>
                    {/* Khối Tổng tiền & Thao tác */}
                    <section className={styles.cardPanel}>
                        <h2 className={styles.sectionLabel}>Tổng kết đơn hàng</h2>
                        <div className={styles.summaryRows}><div className={styles.summaryRow}><span>Tạm tính</span><span>{(order.subTotal ?? order.finalAmount).toLocaleString('vi-VN')} đ</span></div>{!!order.discountAmount && <div className={styles.summaryRow}><span>Giảm giá</span><span>-{order.discountAmount.toLocaleString('vi-VN')} đ</span></div>}<hr className={styles.divider} /><div className={`${styles.summaryRow} ${styles.finalTotalRow}`}><span>Tổng thanh toán</span><span className={styles.finalTotalText}>{order.finalAmount.toLocaleString('vi-VN')} đ</span></div></div>
                        <div><OrderPoints order={order} /></div>
                        {/* Các nút Hành động */}
                        <OrderHistoryActions order={order} allowReview={false} />
                    </section>
                </aside>
            </div>
        </main>
    </div>;
};

export default OrderDetailPage;

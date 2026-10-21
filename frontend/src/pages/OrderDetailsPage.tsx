import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TopBar from '../components/layout/TopBar';
import Header from '../components/layout/Header';
import Navbar from '../components/layout/Navbar';
import Breadcrumb from '../components/common/Breadcrumb';
import { getOrderDetail, cancelOrder, requestRefundOrder } from '../services/orderService';
import { type Order, type OrderItem, OrderStatus } from '../types/order';
import { useToastNotifications } from '../hooks/useToastNotifications';
import ToastNotification from '../components/common/ToastNotification';
import { MoveLeft, PackageCheck, CreditCard, MapPin, Calendar, Clock } from 'lucide-react';
import styles from './OrderDetailPage.module.css';

export const OrderDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { toasts, notify, dismissToast } = useToastNotifications();

    const fetchDetail = async () => {
        if (!id) return;
        setIsLoading(true);
        setError(null);
        try {
            const data = await getOrderDetail(id);
            setOrder(data);
        } catch (err: any) {
            setError(err.message || 'Không thể tải thông tin chi tiết đơn hàng.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
    }, [id]);

    const handleAction = async (actionFn: () => Promise<{ message: string }>, successMsg: string) => {
        if (!window.confirm('Bạn có chắc chắn muốn thực hiện thao tác này?')) return;
        try {
            const res = await actionFn();
            notify(res.message || successMsg, 'success');
            fetchDetail();
        } catch (err: any) {
            notify(err.message || 'Thao tác thất bại.', 'error');
        }
    };

    const getStatusBadge = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.Pending: return <span className={`${styles.badge} ${styles.badgeWarning}`}>Chờ xác nhận</span>;
            case OrderStatus.Confirmed: return <span className={`${styles.badge} ${styles.badgePrimary}`}>Đã xác nhận</span>;
            case OrderStatus.Prepared: return <span className={`${styles.badge} ${styles.badgePrimary}`}>Đã chuẩn bị xong</span>;
            case OrderStatus.Shipping: return <span className={`${styles.badge} ${styles.badgePrimary}`}>Đang giao</span>;
            case OrderStatus.Completed: return <span className={`${styles.badge} ${styles.badgeSuccess}`}>Hoàn thành</span>;
            case OrderStatus.Failed: return <span className={`${styles.badge} ${styles.badgeDanger}`}>Đã hủy</span>;
            case OrderStatus.ReturnRequested: return <span className={`${styles.badge} ${styles.badgeWarning}`}>Chờ duyệt hoàn trả</span>;
            case OrderStatus.ReturnApproved: return <span className={`${styles.badge} ${styles.badgePrimary}`}>Đã duyệt hoàn trả</span>;
            case OrderStatus.Returned: return <span className={`${styles.badge} ${styles.badgeSuccess}`}>Đã hoàn trả</span>;
            default: return null;
        }
    };

    // Hàm hiển thị phân loại Sách Vật Lý (Số lượng) hoặc E-Book (Thời hạn thuê)
    const renderPurchaseFormat = (item: OrderItem) => {
        const isEbook = item.purchaseType === 2 || item.purchaseType === '2' || item.purchaseType === 'Rental' || !!item.rentalDuration;

        if (isEbook) {
            const durationMap: Record<string | number, string> = {
                1: '1 Tuần (7 ngày)',
                2: '1 Tháng (30 ngày)',
                3: '1 Năm (365 ngày)',
                'Weekly': '1 Tuần (7 ngày)',
                'Monthly': '1 Tháng (30 ngày)',
                'Yearly': '1 Năm (365 ngày)',
            };

            const durationText = item.rentalDuration ? (durationMap[item.rentalDuration] || `${item.rentalDuration}`) : '1 Tuần (7 ngày)';

            return (
                <div className={styles.formatWrapper}>
                    <span className={styles.badgeEbook}>Thuê đọc E-Book</span>
                    <span className={styles.metaDuration}>
                        <Clock size={14} /> Thời hạn thuê: <strong>{durationText}</strong>
                    </span>
                </div>
            );
        }

        return (
            <div className={styles.formatWrapper}>
                <span className={styles.badgePhysical}>Sách vật lý</span>
                <span className={styles.metaQty}>
                    Số lượng đặt: <strong>x{item.quantity}</strong> cuốn
                </span>
            </div>
        );
    };

    if (isLoading) {
        return <div className={styles.centerBox}>Đang tải chi tiết đơn hàng #{id}...</div>;
    }

    if (error || !order) {
        return (
            <div className={styles.centerBox}>
                <p style={{ color: 'var(--danger, #d93838)' }}>{error || 'Không tìm thấy đơn hàng.'}</p>
                <button className={styles.btnBack} onClick={() => navigate('/order-history')}>Quay lại danh sách đơn hàng</button>
            </div>
        );
    }

    return (
        <div style={{ background: 'var(--alice, #F2F7FF)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <ToastNotification toasts={toasts} onClose={dismissToast} />
            <TopBar />
            <Header />
            <Navbar />

            <main className={styles.container}>
                <Breadcrumb 
                    items={[
                        { label: 'Trang chủ', link: '/' }, 
                        { label: 'Lịch sử đơn hàng', link: '/order-history' },
                        { label: `Chi tiết đơn hàng #${order.id}` }
                    ]} 
                />

                <button type="button" className={styles.backLink} onClick={() => navigate('/order-history')}>
                    <MoveLeft size={16} />
                    <span>Trở về danh sách đơn hàng</span>
                </button>

                {/* Header Thông tin tổng quan đơn hàng */}
                <div className={styles.cardHeaderInfo}>
                    <div className={styles.headerLeft}>
                        <h1 className={styles.orderTitle}>Mã đơn hàng: #{order.id}</h1>
                        <div className={styles.orderDateMeta}>
                            <Calendar size={15} />
                            <span>Ngày đặt: {new Date(order.orderDate).toLocaleString('vi-VN')}</span>
                        </div>
                    </div>
                    <div className={styles.headerRight}>
                        {getStatusBadge(order.status)}
                    </div>
                </div>

                {/* Grid 2 Cột: Danh sách Sản phẩm bên trái, Thông tin giao hàng & Thanh toán bên phải */}
                <div className={styles.detailGrid}>
                    {/* Cột Trái: Danh sách Sản phẩm */}
                    <div className={styles.cardPanel}>
                        <h2 className={styles.panelTitle}>
                            <PackageCheck size={18} />
                            <span>Sản phẩm đã đặt ({order.orderItems?.length || 0})</span>
                        </h2>

                        <div className={styles.itemList}>
                            {order.orderItems?.map((item) => (
                                <div key={item.id} className={styles.itemCard}>
                                    <img 
                                        src={item.book?.coverImg || 'https://via.placeholder.com/80x110?text=No+Cover'} 
                                        alt={item.book?.title || 'Sách'} 
                                        className={styles.bookCover}
                                    />
                                    
                                    <div className={styles.bookDetails}>
                                        <h3 className={styles.bookTitle}>
                                            {item.book?.title || `Sách ID: ${item.bookId}`}
                                        </h3>
                                        {item.book?.author && (
                                            <p className={styles.bookAuthor}>Tác giả: {item.book.author}</p>
                                        )}

                                        {/* Hiển thị phân loại Vật lý (Số lượng) hoặc E-book (Thời hạn thuê) */}
                                        {renderPurchaseFormat(item)}
                                    </div>

                                    <div className={styles.bookPriceBox}>
                                        <span className={styles.unitPriceText}>
                                            Đơn giá: {item.unitPrice.toLocaleString('vi-VN')} đ
                                        </span>
                                        <span className={styles.itemTotalPrice}>
                                            {(item.unitPrice * (item.quantity || 1)).toLocaleString('vi-VN')} đ
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Cột Phải: Thông tin giao hàng & Tổng tiền */}
                    <div className={styles.sideCol}>
                        {/* Khối giao hàng & thanh toán */}
                        <div className={styles.cardPanel}>
                            <h2 className={styles.panelTitle}>
                                <MapPin size={18} />
                                <span>Thông tin nhận hàng</span>
                            </h2>
                            <div className={styles.infoContent}>
                                <p className={styles.infoRow}>
                                    <strong>Địa chỉ giao hàng:</strong>
                                    <span>{order.shippingAddress || 'Chưa cập nhật địa chỉ'}</span>
                                </p>
                            </div>

                            <hr className={styles.divider} />

                            <h2 className={styles.panelTitle}>
                                <CreditCard size={18} />
                                <span>Thanh toán</span>
                            </h2>
                            <div className={styles.infoContent}>
                                <p className={styles.infoRow}>
                                    <strong>Trạng thái:</strong>
                                    <span className={order.isPaid ? styles.textPaid : styles.textUnpaid}>
                                        {order.isPaid ? (
                                            'Đã thanh toán (MoMo)'
                                        ) : order.payUrl ? (
                                            <>
                                                Chưa thanh toán:{' '}
                                                <a 
                                                    href={order.payUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    style={{ textDecoration: 'underline', color: 'inherit' }} // You can move this to your CSS modules
                                                >
                                                    Nhấn vào đây để thanh toán
                                                </a>
                                            </>
                                        ) : (
                                            'Chưa thanh toán (Thanh toán khi nhận hàng / COD)'
                                        )}
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Khối Tổng tiền & Thao tác */}
                        <div className={styles.cardPanel}>
                            <h2 className={styles.panelTitle}>Tổng kết đơn hàng</h2>
                            <div className={styles.summaryRows}>
                                <div className={styles.summaryRow}>
                                    <span>Tạm tính:</span>
                                    <span>{(order.subTotal || order.finalAmount).toLocaleString('vi-VN')} đ</span>
                                </div>
                                {order.discountAmount ? (
                                    <div className={styles.summaryRow}>
                                        <span>Giảm giá:</span>
                                        <span style={{ color: 'var(--danger, #d93838)' }}>
                                            -{order.discountAmount.toLocaleString('vi-VN')} đ
                                        </span>
                                    </div>
                                ) : null}
                                <hr className={styles.divider} />
                                <div className={`${styles.summaryRow} ${styles.finalTotalRow}`}>
                                    <span>Tổng thanh toán:</span>
                                    <span className={styles.finalTotalText}>
                                        {order.finalAmount.toLocaleString('vi-VN')} đ
                                    </span>
                                </div>
                            </div>

                            {/* Các nút Hành động */}
                            <div className={styles.actionSection}>
                                {[OrderStatus.Pending, OrderStatus.Confirmed, OrderStatus.Prepared].includes(order.status) && (
                                    <button 
                                        type="button" 
                                        className={styles.btnDanger}
                                        onClick={() => handleAction(() => cancelOrder(order.id), 'Đã gửi yêu cầu hủy/hủy đơn hàng thành công')}
                                    >
                                        Hủy đơn hàng này
                                    </button>
                                )}

                                {order.status === OrderStatus.Completed && (
                                    <button 
                                        type="button" 
                                        className={styles.btnWarning}
                                        onClick={() => handleAction(() => requestRefundOrder(order.id), 'Đã gửi yêu cầu hoàn trả')}
                                    >
                                        Yêu cầu hoàn trả
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default OrderDetailPage;

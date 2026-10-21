import React, { useEffect, useState, useMemo } from 'react';
import TopBar from '../components/layout/TopBar';
import Header from '../components/layout/Header';
import Navbar from '../components/layout/Navbar';
import Breadcrumb from '../components/common/Breadcrumb';
import { getMyOrders, getOrderDetail, cancelOrder, requestRefundOrder } from '../services/orderService';
import { type Order, type OrderItem, OrderStatus } from '../types/order';
import { useToastNotifications } from '../hooks/useToastNotifications';
import ToastNotification from '../components/common/ToastNotification';
import { Clock } from 'lucide-react';
import styles from './OrderHistoryPage.module.css';
import { useNavigate } from 'react-router-dom';

type TabType = 'ALL' | 'PREPARING' | 'SHIPPING' | 'DELIVERED';

const TABS: { id: TabType; label: string; statuses: OrderStatus[] }[] = [
    { id: 'ALL', label: 'Xem toàn bộ', statuses: [] },
    { id: 'PREPARING', label: 'Đang chuẩn bị', statuses: [OrderStatus.Pending, OrderStatus.Confirmed, OrderStatus.Prepared] },
    { id: 'SHIPPING', label: 'Đang giao', statuses: [OrderStatus.Shipping] },
    { id: 'DELIVERED', label: 'Đã giao', statuses: [OrderStatus.Completed] },
];

export const OrderHistoryPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('ALL');
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [expandedOrderIds, setExpandedOrderIds] = useState<Record<number, boolean>>({});
    
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);

    const { toasts, notify, dismissToast } = useToastNotifications();

    const navigation = useNavigate();

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const data = await getMyOrders(1, 50);
            setOrders(data.items);
        } catch (error: any) {
            notify(error.message || 'Lỗi khi tải danh sách đơn hàng', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const isRefundable = (order: Order) => {
        if (order.status !== OrderStatus.Completed) return false;
        
        const baseDate = (order as any).updatedAt || order.orderDate; 
        if (!baseDate) return true;

        const diffTime = new Date().getTime() - new Date(baseDate).getTime();
        const diffDays = diffTime / (1000 * 3600 * 24);
        
        return diffDays <= 5;
    };

    const filteredOrders = useMemo(() => {
        if (activeTab === 'ALL') return orders;
        const currentTabConfig = TABS.find(t => t.id === activeTab);
        return orders.filter(order => currentTabConfig?.statuses.includes(order.status));
    }, [orders, activeTab]);

    const toggleExpandOrder = (orderId: number) => {
        setExpandedOrderIds(prev => ({
            ...prev,
            [orderId]: !prev[orderId]
        }));
    };

    const handleAction = async (actionFn: () => Promise<{ message: string }>, successMsg: string) => {
        if (!window.confirm('Bạn có chắc chắn thực hiện thao tác này?')) return;
        try {
            const res = await actionFn();
            notify(res.message || successMsg, 'success');
            fetchOrders();
            if (selectedOrder) setSelectedOrder(null);
        } catch (error: any) {
            notify(error.message || 'Thao tác thất bại', 'error');
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
                        <Clock size={14} /> 
                        <div>Thời hạn thuê: <strong>{durationText}</strong></div>
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

    return (
        <div style={{ background: 'var(--alice, #F2F7FF)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <ToastNotification toasts={toasts} onClose={dismissToast} />
            <TopBar />
            <Header />
            <Navbar />

            <main className={styles.container}>
                <Breadcrumb items={[{ label: 'Trang chủ', link: '/' }, { label: 'Lịch sử đơn hàng' }]} />
                
                <div className={styles.pageWrap}>
                    <h1 className={styles.pageTitle}>Đơn hàng của tôi</h1>
                    
                    <div className={styles.tabsContainer}>
                        <div className={styles.tabHeaders}>
                            {TABS.map(tab => (
                                <div 
                                    key={tab.id}
                                    className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    {tab.label}
                                </div>
                            ))}
                        </div>

                        {/* Danh sách đơn hàng */}
                        <div className={styles.orderList}>
                            {isLoading ? (
                                <div className={styles.emptyState}>Đang tải dữ liệu...</div>
                            ) : filteredOrders.length === 0 ? (
                                <div className={styles.emptyState}>Chưa có đơn hàng nào trong trạng thái này.</div>
                            ) : (
                                filteredOrders.map(order => {
                                    const isExpanded = !!expandedOrderIds[order.id];
                                    const itemCount = order.orderItems?.length || 0;

                                    return (
                                        <div key={order.id} className={styles.orderCard}>
                                            <div className={styles.orderHeader}>
                                                <div className={styles.orderHeaderLeft}>
                                                    <span className={styles.orderId}>Mã đơn: #{order.id}</span>
                                                    <span className={styles.orderDate}>
                                                        {new Date(order.orderDate).toLocaleDateString('vi-VN')}
                                                    </span>
                                                </div>
                                                {getStatusBadge(order.status)}
                                            </div>
                                            
                                            {/* Dropdown */}
                                            <button 
                                                type="button"
                                                className={styles.dropdownToggleBtn}
                                                onClick={() => toggleExpandOrder(order.id)}
                                            >
                                                <span>{isExpanded ? '▲ Thu gọn danh sách món hàng' : `▼ Mở xem ${itemCount} món hàng đã đặt`}</span>
                                            </button>

                                            {isExpanded && (
                                                <div className={styles.orderBody}>
                                                    {order.orderItems?.map(item => (
                                                        <div key={item.id} className={styles.itemRow}>
                                                            <div className={styles.itemInfo}>
                                                                <img 
                                                                    src={item.book?.coverImg || 'https://via.placeholder.com/50x70?text=No+Img'} 
                                                                    alt={item.book?.title} 
                                                                    className={styles.itemThumb} 
                                                                />
                                                                <div className={styles.itemMeta}>
                                                                    <span className={styles.itemTitle}>{item.book?.title || `Sách ID: ${item.bookId}`}</span>
                                                                    {renderPurchaseFormat(item)}
                                                                </div>
                                                            </div>
                                                            <span className={styles.itemPrice}>{(item.unitPrice * (item.quantity || 1)).toLocaleString('vi-VN')} đ</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className={styles.orderFooter}>
                                                <div className={styles.totalWrap}>
                                                    <span>Tổng tiền:</span>
                                                    <span className={styles.totalPrice}>{order.finalAmount.toLocaleString('vi-VN')} đ</span>
                                                </div>
                                                
                                                <div className={styles.actionBtns}>
                                                    {/* Chi Tiết */}
                                                    <button 
                                                        type="button"
                                                        className={styles.btnSecondary}
                                                        onClick={() => {navigation(`${order.id}`)}}
                                                        disabled={isDetailLoading}
                                                    >
                                                        Xem chi tiết
                                                    </button>

                                                    {/* Hủy đơn */}
                                                    {[OrderStatus.Pending, OrderStatus.Confirmed, OrderStatus.Prepared].includes(order.status) && (
                                                        <button 
                                                            type="button"
                                                            className={styles.btnDangerOutlined}
                                                            onClick={() => handleAction(() => cancelOrder(order.id), 'Đã hủy đơn hàng thành công')}
                                                        >
                                                            Hủy đơn
                                                        </button>
                                                    )}

                                                    {/* Hoàn trả */}
                                                    {isRefundable(order) && (
                                                        <button 
                                                            type="button"
                                                            className={styles.btnDangerOutlined}
                                                            onClick={() => navigation(`/refund/${order.id}`)}
                                                        >
                                                            Yêu cầu hoàn tiền
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default OrderHistoryPage;
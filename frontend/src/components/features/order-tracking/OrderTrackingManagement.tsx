import React from 'react';
import { Link } from 'react-router-dom';
import {
    Search,
    Truck,
    PackageCheck,
    MapPin,
    Phone,
    CreditCard,
    Clock,
    CheckCircle2,
    AlertCircle,
    Warehouse,
    BookOpen,
} from 'lucide-react';
import { useOrderTracking } from '../../../hooks/useOrderTracking';
import styles from '../../../pages/OrderTrackingPage.module.css';

const statusLabels: Record<string, string> = {
    Pending: 'Chờ xác nhận',
    Confirmed: 'Đã xác nhận',
    Prepared: 'Đã đóng gói xong',
    Shipping: 'Đang giao hàng',
    Completed: 'Giao hàng thành công',
    Failed: 'Đã hủy / Giao thất bại',
    ReturnRequested: 'Chờ duyệt hoàn trả',
    ReturnApproved: 'Chờ Shipper thu hồi',
    Returned: 'Đã hoàn trả',
};

export const OrderTrackingManagement: React.FC = () => {
    const { orderIdInput, setOrderIdInput, tracking, recentOrders, loading, error, handleSearch } =
        useOrderTracking();

    const getStatusBadgeClass = (status: string) => {
        if (status === 'Completed') return styles.statusCompleted;
        if (status === 'Shipping' || status === 'Prepared' || status === 'Confirmed')
            return styles.statusShipping;
        if (status === 'Failed') return styles.statusFailed;
        return styles.statusPending;
    };

    return (
        <main className={styles.container}>
            {/* Banner tiêu đề */}
            <section className={styles.heroBanner}>
                <div className={styles.heroTitle}>
                    <span className={styles.heroBadge}>
                        <Truck size={14} /> Physical Order Tracking
                    </span>
                    <h1>Tra cứu & Theo dõi Tiến trình Đơn hàng Vật lý</h1>
                    <p>
                        Kiểm tra trực tiếp trạng thái đóng gói tại kho, hành trình Shipper giao nhận và chi tiết hóa
                        đơn theo thời gian thực
                    </p>
                </div>
                <div className={styles.heroActions}>
                    <Link to="/staff/warehouse" className={styles.btnHeroAdmin}>
                        <Warehouse size={16} /> Mở Quản lý Kho & Điều phối (Staff)
                    </Link>
                </div>
            </section>

            {/* Khung tìm kiếm mã vận đơn */}
            <section className={styles.searchCard}>
                <form
                    className={styles.searchForm}
                    onSubmit={(e) => {
                        e.preventDefault();
                        void handleSearch();
                    }}
                >
                    <div className={styles.searchInputWrap}>
                        <Search size={18} />
                        <input
                            type="text"
                            className={styles.searchInput}
                            value={orderIdInput}
                            onChange={(e) => setOrderIdInput(e.target.value)}
                            placeholder="Nhập mã vận đơn (VD: ORD-00000001, ORD-00000002 hoặc 1, 2)..."
                        />
                    </div>
                    <button type="submit" className={styles.btnSearch} disabled={loading}>
                        <Search size={16} />
                        {loading ? 'Đang tra cứu...' : 'Tra cứu tiến trình'}
                    </button>
                </form>

                {recentOrders.length > 0 && (
                    <div className={styles.quickChips}>
                        <span>Vận đơn gần đây trong hệ thống:</span>
                        {recentOrders.slice(0, 8).map((o) => (
                            <button
                                key={o.orderId}
                                type="button"
                                className={`${styles.quickChipBtn} ${
                                    tracking?.orderId === o.orderId ? styles.active : ''
                                }`}
                                onClick={() => {
                                    setOrderIdInput(o.orderCode);
                                    void handleSearch(o.orderId);
                                }}
                            >
                                <PackageCheck size={13} />
                                {o.orderCode} • {statusLabels[o.status] ?? o.status}
                            </button>
                        ))}
                    </div>
                )}
            </section>

            {error && (
                <div className={styles.errorAlert}>
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            {tracking && (
                <section className={styles.card}>
                    <div className={styles.orderHeader}>
                        <div>
                            <h2 className={styles.orderCodeTitle}>
                                <PackageCheck size={22} />
                                Vận đơn {tracking.orderCode}
                            </h2>
                            <div className={styles.orderMeta}>
                                <span>
                                    <Clock size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                                    Ngày đặt: <strong>{new Date(tracking.orderDate).toLocaleString('vi-VN')}</strong>
                                </span>
                                <span>
                                    Mã hệ thống: <strong>#{tracking.orderId}</strong>
                                </span>
                            </div>
                        </div>

                        <span className={`${styles.statusBadge} ${getStatusBadgeClass(tracking.status)}`}>
                            <CheckCircle2 size={15} />
                            {statusLabels[tracking.status] ?? tracking.status} ({tracking.status})
                        </span>
                    </div>

                    {/* Thanh Timeline 5 bước */}
                    <h3 className={styles.sectionTitle}>
                        <Clock size={17} /> Hành trình xử lý & giao nhận vận đơn
                    </h3>
                    <div className={styles.timelineStepper}>
                        {tracking.timeline.map((step, idx) => (
                            <div
                                key={step.stepCode}
                                className={`${styles.stepCard} ${
                                    step.isCurrent
                                        ? styles.current
                                        : step.isCompleted
                                          ? styles.completed
                                          : ''
                                }`}
                            >
                                <div className={styles.stepTop}>
                                    <div className={styles.stepCircle}>
                                        {step.isCompleted ? '✓' : idx + 1}
                                    </div>
                                    <span className={styles.stepStateTag}>
                                        {step.isCurrent
                                            ? 'Hiện tại'
                                            : step.isCompleted
                                              ? 'Đã qua'
                                              : 'Chờ xử lý'}
                                    </span>
                                </div>
                                <div className={styles.stepTitle}>{step.title}</div>
                                <div className={styles.stepDesc}>{step.description}</div>
                                {step.timestamp && (
                                    <div className={styles.stepTime}>
                                        {new Date(step.timestamp).toLocaleString('vi-VN')}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Thông tin Giao nhận & Shipper */}
                    <div className={styles.infoGrid}>
                        <div className={styles.infoBox}>
                            <div className={styles.infoBoxHeader}>
                                <MapPin size={16} /> Thông tin địa chỉ & Thanh toán
                            </div>
                            <div className={styles.infoRow}>
                                <span>Địa chỉ nhận hàng:</span>
                                <strong>{tracking.shippingAddress}</strong>
                            </div>
                            <div className={styles.infoRow}>
                                <span>Trạng thái thanh toán:</span>
                                <strong style={{ color: tracking.isPaid ? '#15803d' : '#d97706' }}>
                                    <CreditCard
                                        size={14}
                                        style={{ verticalAlign: 'middle', marginRight: 4 }}
                                    />
                                    {tracking.isPaid ? 'Đã thanh toán' : 'Thanh toán khi nhận hàng (COD)'}
                                </strong>
                            </div>
                        </div>

                        <div className={styles.infoBox}>
                            <div className={styles.infoBoxHeader}>
                                <Truck size={16} /> Nhân viên vận chuyển (Shipper phụ trách)
                            </div>
                            {tracking.shipperName ? (
                                <>
                                    <div className={styles.infoRow}>
                                        <span>Họ và tên Shipper:</span>
                                        <strong>{tracking.shipperName}</strong>
                                    </div>
                                    <div className={styles.infoRow}>
                                        <span>Số điện thoại liên hệ:</span>
                                        <strong>
                                            <Phone
                                                size={13}
                                                style={{ verticalAlign: 'middle', marginRight: 4 }}
                                            />
                                            {tracking.shipperPhone}
                                        </strong>
                                    </div>
                                </>
                            ) : (
                                <div style={{ fontSize: 13, color: '#5b6e99', paddingTop: 4 }}>
                                    Đơn hàng đang được chuẩn bị tại kho và chờ điều phối viên phân công Shipper.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Danh sách sản phẩm trong đơn */}
                    <h3 className={styles.sectionTitle}>
                        <BookOpen size={17} /> Chi tiết đầu sách trong vận đơn ({tracking.items.length} sản phẩm)
                    </h3>
                    <table className={styles.itemsTable}>
                        <thead>
                            <tr>
                                <th>Đầu sách</th>
                                <th>Số lượng</th>
                                <th>Đơn giá</th>
                                <th>Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tracking.items.map((item) => (
                                <tr key={item.bookId}>
                                    <td>
                                        <div className={styles.bookCell}>
                                            <img
                                                src={
                                                    item.coverImg ||
                                                    'https://salt.tikicdn.com/ts/product/45/3e/2e/9f992ab2a5436d4f937d9fae16d47b53.jpg'
                                                }
                                                alt={item.bookTitle}
                                                className={styles.bookThumb}
                                            />
                                            <div>
                                                <div style={{ fontWeight: 700, color: '#071233' }}>
                                                    {item.bookTitle || `Sách cổ #${item.bookId}`}
                                                </div>
                                                <div style={{ fontSize: 12, color: '#5b6e99' }}>
                                                    Mã sách: #{item.bookId}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 700 }}>x{item.quantity}</td>
                                    <td>{item.unitPrice.toLocaleString('vi-VN')} đ</td>
                                    <td style={{ fontWeight: 700, color: '#0d226b' }}>
                                        {item.subTotal.toLocaleString('vi-VN')} đ
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className={styles.summaryFooter}>
                        <div className={styles.summaryRow}>
                            <span>Tạm tính tiền sách:</span>
                            <strong>{tracking.subTotal.toLocaleString('vi-VN')} đ</strong>
                        </div>
                        <div className={styles.summaryRow}>
                            <span>Giảm giá (F-Point):</span>
                            <strong>-{tracking.discountAmount.toLocaleString('vi-VN')} đ</strong>
                        </div>
                        <div className={styles.summaryTotal}>
                            <span>Tổng thanh toán:</span>
                            <span>{tracking.finalAmount.toLocaleString('vi-VN')} đ</span>
                        </div>
                    </div>
                </section>
            )}
        </main>
    );
};

export default OrderTrackingManagement;

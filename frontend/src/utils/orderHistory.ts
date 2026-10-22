import { OrderStatus, type Order, type OrderItem } from '../types/order';

export type OrderHistoryTab = 'all' | 'preparing' | 'shipping' | 'completed' | 'returns';
export const orderTabs: { id: OrderHistoryTab; label: string; statuses: OrderStatus[] }[] = [
    { id: 'all', label: 'Xem toàn bộ', statuses: [] },
    { id: 'preparing', label: 'Đang chuẩn bị', statuses: [OrderStatus.Pending, OrderStatus.Confirmed, OrderStatus.Prepared] },
    { id: 'shipping', label: 'Đang giao', statuses: [OrderStatus.Shipping] },
    { id: 'completed', label: 'Hoàn thành', statuses: [OrderStatus.Completed, OrderStatus.Failed] },
    { id: 'returns', label: 'Hoàn hàng', statuses: [OrderStatus.ReturnRequested, OrderStatus.ReturnApproved, OrderStatus.Returned] },
];
export const orderStatusLabels: Record<OrderStatus, string> = {
    1: 'Chờ xác nhận', 2: 'Đã xác nhận', 3: 'Đã chuẩn bị xong', 4: 'Đang giao',
    5: 'Hoàn thành', 6: 'Thất bại', 7: 'Chờ duyệt hoàn trả', 8: 'Đã duyệt hoàn trả', 9: 'Hoàn trả thành công',
};
export const purchaseType = (item: OrderItem) => {
    const type = String(item.purchaseType).toLowerCase();
    if (type === '3' || type === 'ebook') return 'ebook';
    return type === '2' || type === 'rental' || item.rentalDuration ? 'rental' : 'physical';
};
export const bookIdOf = (item?: OrderItem) => item?.bookId || item?.book?.id || 0;
export const purePhysicalOrder = (order: Order) => order.orderItems.length > 0 && order.orderItems.every(item => purchaseType(item) === 'physical');
export const canCancelOrder = (order: Order) => order.status === OrderStatus.Pending ||
    order.status === OrderStatus.Confirmed && order.orderItems.some(item => purchaseType(item) === 'physical');
export const canReviewOrder = (order: Order) => order.status === OrderStatus.Completed && order.isPaid && order.orderItems.length > 0;
export const canReturnOrder = (order: Order) => purePhysicalOrder(order) && canReviewOrder(order) && !order.returnInfo;
export const withinReturnWindow = (order: Order, now = Date.now()) => !!order.returnDeadline && new Date(order.returnDeadline).getTime() >= now;
export const rentalLabel = (item: OrderItem) => ({ '1': '1 Tuần (7 ngày)', weekly: '1 Tuần (7 ngày)', '2': '1 Tháng', monthly: '1 Tháng', '3': '1 Năm', yearly: '1 Năm' }[String(item.rentalDuration).toLowerCase()] ?? 'Gói thuê');
export const purchaseLink = (item: OrderItem) => `/books/${bookIdOf(item)}?format=${purchaseType(item) === 'rental' ? 'rental' : 'physical'}`;
export const dateTime = (value?: string | null) => value ? new Date(value).toLocaleString('vi-VN') : 'Chưa cập nhật';
export const rewardLabel = (order: Order) => {
    if (!order.isPaid || ![OrderStatus.Completed, OrderStatus.ReturnRequested, OrderStatus.ReturnApproved].includes(order.status)) return '';
    const points = order.rewardPoints ?? 0;
    const pending = [OrderStatus.ReturnRequested, OrderStatus.ReturnApproved].includes(order.status) ||
        purePhysicalOrder(order) && !order.returnInfo?.outcome && withinReturnWindow(order);
    return `+${points.toLocaleString('vi-VN')} điểm${pending ? ', chờ duyệt' : ' đã vào ví'}`;
};

export const orderPeriods = [
    { value: 'all', label: 'Tất cả thời gian' }, { value: 'today', label: 'Hôm nay' },
    { value: 'week', label: 'Tuần này' }, { value: 'month', label: 'Tháng này' },
    { value: 'last_month', label: 'Tháng trước' }, { value: 'custom', label: 'Chọn khoảng ngày' },
];
export const orderTypes = [
    { value: 'all', label: 'Tất cả loại đơn' }, { value: 'physical', label: 'Chỉ sách vật lý' },
    { value: 'online', label: 'Chỉ sách online' }, { value: 'mixed', label: 'Đơn hỗn hợp' },
] as const;
export const orderSorts = [
    { value: 'newest', label: 'Mới nhất trước' }, { value: 'oldest', label: 'Cũ nhất trước' },
    { value: 'price_asc', label: 'Tổng tiền tăng dần' }, { value: 'price_desc', label: 'Tổng tiền giảm dần' },
] as const;
const dateInput = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const validOrderDate = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number);
    return year >= 1000 && dateInput(new Date(year, month - 1, day)) === value;
};
// Tính khoảng ngày đặt đơn theo giờ Việt Nam.
export const orderDateRange = (period: string, from: string, to: string, now = new Date()) => {
    if (period === 'custom') return { fromDate: from || undefined, toDate: to || undefined };
    if (period === 'all') return {};
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
    const part = (name: string) => Number(parts.find(value => value.type === name)?.value);
    const end = new Date(part('year'), part('month') - 1, part('day'));
    const start = new Date(end);
    if (period === 'week') start.setDate(start.getDate() - (start.getDay() + 6) % 7);
    if (period === 'month') start.setDate(1);
    if (period === 'last_month') { start.setDate(1); start.setMonth(start.getMonth() - 1); end.setDate(0); }
    return { fromDate: dateInput(start), toDate: dateInput(end) };
};

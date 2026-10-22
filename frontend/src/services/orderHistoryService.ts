import { getMyOrders } from './orderService';
import type { Order, OrderHistoryFilters, PagedResult } from '../types/order';
import { orderTabs, purePhysicalOrder, purchaseType } from '../utils/orderHistory';

// Đọc hết các trang API để các tab không bỏ sót đơn cũ.
export const getOrderHistory = async () => {
    const result: Order[] = [];
    for (let page = 1; ; page++) {
        const response = await getMyOrders(page, 100);
        result.push(...response.items);
        if (result.length >= response.totalCount || response.items.length < 100) break;
    }
    return result;
};

const overlays = new Map<string, Record<number, Partial<Order>>>();
const accountKey = () => {
    try { return `order-history:${JSON.parse(localStorage.getItem('currentUser') ?? '{}').id ?? 'guest'}`; }
    catch { return 'order-history:guest'; }
};
const readChanges = () => {
    const key = accountKey();
    if (!overlays.has(key)) {
        try { overlays.set(key, JSON.parse(sessionStorage.getItem(key) ?? '{}')); }
        catch { overlays.set(key, {}); }
    }
    return overlays.get(key)!;
};
export const presentOrder = (order: Order): Order => {
    const presented = { ...order, ...readChanges()[order.id] };
    if (order.presentationScenario === 14) presented.orderItems = order.orderItems.map(item => ({ ...item, purchaseType: 3, rentalDuration: null }));
    return presented;
};

// Phân trang lịch sử và áp dụng trạng thái trong phiên giao diện.
export const getPagedOrderHistory = async (page: number, size: number, filters: OrderHistoryFilters): Promise<PagedResult<Order>> => {
    if (Object.keys(readChanges()).length === 0) {
        const response = await getMyOrders(page, size, filters);
        return { ...response, items: response.items.map(presentOrder) };
    }
    const statuses = orderTabs.find(tab => tab.id === filters.statusGroup)?.statuses ?? [];
    const orders = (await getOrderHistory()).map(presentOrder).filter(order => {
        const day = order.orderDate.slice(0, 10);
        if (statuses.length && !statuses.includes(order.status)) return false;
        if (filters.bookTitle && !order.orderItems.some(item => item.book?.title.toLowerCase().includes(filters.bookTitle!.toLowerCase()))) return false;
        if (filters.fromDate && day < filters.fromDate || filters.toDate && day > filters.toDate) return false;
        const physical = purePhysicalOrder(order);
        const online = order.orderItems.length > 0 && order.orderItems.every(item => purchaseType(item) !== 'physical');
        return !filters.orderType || filters.orderType === 'all' || filters.orderType === 'physical' && physical || filters.orderType === 'online' && online || filters.orderType === 'mixed' && !physical && !online && order.orderItems.length > 0;
    });
    orders.sort((left, right) => {
        const newest = right.orderDate.localeCompare(left.orderDate) || right.id - left.id;
        if (filters.sortBy === 'oldest') return -newest;
        if (filters.sortBy === 'price_asc') return left.finalAmount - right.finalAmount || newest;
        if (filters.sortBy === 'price_desc') return right.finalAmount - left.finalAmount || newest;
        return newest;
    });
    return { items: orders.slice((page - 1) * size, page * size), totalCount: orders.length, pageNumber: page, pageSize: size };
};
// Các thao tác chờ BE được giữ riêng trong phiên giao diện, không gọi API giao dịch.
export const updateOrderPresentation = (order: Order, patch: Partial<Order>) => {
    const changes = readChanges();
    changes[order.id] = { ...changes[order.id], ...patch };
    // Giữ dữ liệu trong bộ nhớ nếu dung lượng lưu phiên đã đầy.
    try { sessionStorage.setItem(accountKey(), JSON.stringify(changes)); } catch { return window.dispatchEvent(new Event('order-history-changed')); }
    window.dispatchEvent(new Event('order-history-changed'));
};

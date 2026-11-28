import { getMyOrders } from './orderService';
import type { Order, OrderHistoryFilters, PagedResult } from '../types/order';

export const getOrderHistory = async () => {
    const result: Order[] = [];
    for (let page = 1; ; page++) {
        const response = await getMyOrders(page, 100);
        result.push(...response.items);
        if (result.length >= response.totalCount || response.items.length < 100) break;
    }
    return result;
};

export const presentOrder = (order: Order): Order => {
    const presented = { ...order };
    if (order.presentationScenario === 14) presented.orderItems = order.orderItems.map(item => ({ ...item, purchaseType: 3, rentalDuration: null }));
    return presented;
};

export const getPagedOrderHistory = async (page: number, size: number, filters: OrderHistoryFilters): Promise<PagedResult<Order>> => {
    const response = await getMyOrders(page, size, filters);
    return { ...response, items: response.items.map(presentOrder) };
};

export const notifyOrderHistoryChanged = () => {
    window.dispatchEvent(new Event('order-history-changed'));
};

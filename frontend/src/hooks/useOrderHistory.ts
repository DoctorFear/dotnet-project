import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { getPagedOrderHistory } from '../services/orderHistoryService';
import { orderDateRange, orderPeriods, orderSorts, orderTabs, orderTypes, validOrderDate, type OrderHistoryTab } from '../utils/orderHistory';
import type { Order, OrderHistoryFilters } from '../types/order';

export const useOrderHistory = () => {
    const { user } = useUser();
    const [params, setParams] = useSearchParams();
    const [orders, setOrders] = useState<Order[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [version, refresh] = useState(0);
    const tab = orderTabs.some(item => item.id === params.get('tab')) ? params.get('tab') as OrderHistoryTab : 'all';
    const requestedPage = Number(params.get('page'));
    const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const pageSize = [5, 10, 20].includes(Number(params.get('size'))) ? Number(params.get('size')) : 5;
    const bookTitle = (params.get('q') ?? '').trim();
    const period = orderPeriods.some(item => item.value === params.get('period')) ? params.get('period')! : 'all';
    const orderType = orderTypes.find(item => item.value === params.get('type'))?.value ?? 'all';
    const sortBy = orderSorts.find(item => item.value === params.get('sort'))?.value ?? 'newest';
    const from = params.get('from') ?? '';
    const to = params.get('to') ?? '';
    const invalidDates = period === 'custom' && (from && !validOrderDate(from) || to && !validOrderDate(to) || from && to && from > to);
    const query = JSON.stringify({ bookTitle, orderType, sortBy, statusGroup: tab, ...orderDateRange(period, from, to) });
    const navigate = useCallback((values: Record<string, string>, replace = false) => {
        setParams(current => {
            const next = new URLSearchParams(current);
            Object.entries(values).forEach(([key, value]) => { if (value) next.set(key, value); else next.delete(key); });
            return next;
        }, { replace });
    }, [setParams]);
    useEffect(() => {
        let active = true;
        void Promise.resolve().then(async () => {
            if (!active) return;
            setLoading(true); setError('');
            try {
                if (invalidDates) throw new Error('Khoảng ngày không hợp lệ. Ngày bắt đầu không được lớn hơn ngày kết thúc.');
                const response = await getPagedOrderHistory(page, pageSize, JSON.parse(query) as OrderHistoryFilters);
                if (!active) return;
                const lastPage = Math.max(1, Math.ceil(response.totalCount / pageSize));
                if (page > lastPage) { navigate({ page: String(lastPage) }, true); return; }
                setOrders(response.items); setTotal(response.totalCount);
            } catch (cause) {
                if (active) { setOrders([]); setTotal(0); setError(cause instanceof Error ? cause.message : 'Không thể tải lịch sử đơn hàng.'); }
            } finally { if (active) setLoading(false); }
        });
        return () => { active = false; };
    }, [user?.id, query, page, pageSize, version, invalidDates, navigate]);
    useEffect(() => {
        const update = () => refresh(current => current + 1);
        window.addEventListener('order-history-changed', update);
        const timer = window.setInterval(update, 60000);
        return () => { window.removeEventListener('order-history-changed', update); window.clearInterval(timer); };
    }, []);
    const activeFilters = [
        ...(bookTitle ? [{ key: 'q', label: `Tên sách: ${bookTitle}` }] : []),
        ...(period !== 'all' ? [{ key: 'period', label: period === 'custom' ? `${from || 'Không giới hạn'} → ${to || 'Không giới hạn'}` : orderPeriods.find(item => item.value === period)!.label }] : []),
        ...(orderType !== 'all' ? [{ key: 'type', label: orderTypes.find(item => item.value === orderType)!.label }] : []),
        ...(sortBy !== 'newest' ? [{ key: 'sort', label: orderSorts.find(item => item.value === sortBy)!.label }] : []),
    ];
    return { orders, loading, error, tab, page, pageSize, total, pageOrders: orders, bookTitle, period, orderType, sortBy, from, to, activeFilters,
        setTab: (value: OrderHistoryTab) => navigate({ tab: value, page: '1' }),
        setPage: (value: number) => navigate({ page: String(value) }),
        setPageSize: (value: number) => navigate({ size: String(value), page: '1' }),
        setSearch: (value: string) => navigate({ q: value.trim(), page: '1' }),
        setPeriod: (value: string) => navigate({ period: value, from: '', to: '', page: '1' }),
        setType: (value: string) => navigate({ type: value, page: '1' }),
        setSort: (value: string) => navigate({ sort: value, page: '1' }),
        setDates: (start: string, end: string) => navigate({ from: start, to: end, page: '1' }),
        removeFilter: (key: string) => navigate({ [key]: '', ...(key === 'period' ? { from: '', to: '' } : {}), page: '1' }),
        clearFilters: () => navigate({ q: '', period: '', from: '', to: '', type: '', sort: '', page: '1' }),
        returnPath: '/order-history?' + params.toString() };
};

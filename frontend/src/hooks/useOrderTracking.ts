import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { shipperService } from '../services/shipperService';
import type { OrderTrackingDetailDto, PhysicalOrderSummaryDto } from '../types/shipper';

export const useOrderTracking = () => {
    const { orderId: paramOrderId } = useParams<{ orderId?: string }>();
    const [searchParams] = useSearchParams();
    const initialId = paramOrderId || searchParams.get('id') || '';

    const [orderIdInput, setOrderIdInput] = useState(initialId);
    const [tracking, setTracking] = useState<OrderTrackingDetailDto | null>(null);
    const [recentOrders, setRecentOrders] = useState<PhysicalOrderSummaryDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (idToFetch?: number) => {
        const raw = idToFetch !== undefined ? String(idToFetch) : orderIdInput.replace(/[^0-9]/g, '');
        const parsed = Number(raw);
        if (!parsed || parsed <= 0) {
            setError('Vui lòng nhập mã vận đơn hợp lệ (ví dụ: ORD-00000001 hoặc số ID đơn hàng).');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const data = await shipperService.getOrderTracking(parsed);
            setTracking(data);
        } catch (err) {
            setTracking(null);
            setError(err instanceof Error ? err.message : 'Không tìm thấy thông tin vận đơn.');
        } finally {
            setLoading(false);
        }
    };

    const loadRecentOrders = async () => {
        try {
            const list = await shipperService.getPhysicalOrders();
            setRecentOrders(list);
            if (!initialId && list.length > 0 && !tracking) {
                setOrderIdInput(list[0].orderCode);
                await handleSearch(list[0].orderId);
            }
        } catch {
            // ignore
        }
    };

    useEffect(() => {
        void loadRecentOrders();
        if (initialId) {
            const num = Number(initialId.replace(/[^0-9]/g, ''));
            if (num > 0) void handleSearch(num);
        }
    }, [initialId]);

    return {
        orderIdInput,
        setOrderIdInput,
        tracking,
        recentOrders,
        loading,
        error,
        handleSearch,
    };
};

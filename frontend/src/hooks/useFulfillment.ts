import { useCallback, useState } from 'react';
import { useWorkflow } from '../context/WorkflowContext';
import { useWorkflowResource } from './useWorkflowResource';
import { useToastNotifications } from './useToastNotifications';
import type { PackingDetail, PackingQuery } from '../types/workflow';

export function useFulfillment() {
    const { api } = useWorkflow();
    const [query, setQuery] = useState<PackingQuery>({ pageNumber: 1, pageSize: 10 });
    const load = useCallback(() => api.packingOrders(query), [api, query]);
    const orders = useWorkflowResource(load);
    const [selected, setSelected] = useState<PackingDetail | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const notifications = useToastNotifications();
    const select = async (id: number) => {
        setLoadingDetail(true);
        setError('');
        try {
            setSelected(await api.packingDetail(id));
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Không thể tải đơn.');
        } finally {
            setLoadingDetail(false);
        }
    };
    const save = async (reason?: string) => {
        if (!selected || busy) return false;
        setBusy(true);
        setError('');
        try {
            if (reason !== undefined) {
                await api.packingIssue(selected.orderId, reason);
                setSelected(await api.packingDetail(selected.orderId));
            } else {
                await api.confirmPacking(selected.orderId);
                setSelected(null);
            }
            orders.reload();
            notifications.notify(
                reason === undefined
                    ? 'Đã đóng gói xong. Đơn đang chờ phân công Shipper.'
                    : 'Đã báo sự cố kho. Đơn vẫn giữ trạng thái Đã xác nhận.',
            );
            return true;
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Không thể cập nhật.');
            orders.reload();
            return false;
        } finally {
            setBusy(false);
        }
    };
    return {
        orders,
        query,
        setQuery,
        selected,
        setSelected,
        select,
        loadingDetail,
        busy,
        error,
        setError,
        save,
        notifications,
    };
}

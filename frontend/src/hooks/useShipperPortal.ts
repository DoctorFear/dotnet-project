import { useCallback, useState } from 'react';
import { useWorkflow } from '../context/WorkflowContext';
import { useWorkflowResource } from './useWorkflowResource';
import { useToastNotifications } from './useToastNotifications';
import type { DeliveryDetail, DeliveryStatus, DeliveryUpdate, FailureReason } from '../types/workflow';

export function useShipperPortal() {
    const { api } = useWorkflow();
    const [status, setStatus] = useState('');
    const [keyword, setKeyword] = useState('');
    const [page, setPage] = useState(1);
    const [detail, setDetail] = useState<DeliveryDetail | null>(null);
    const [detailId, setDetailId] = useState<number | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [action, setAction] = useState<'start' | 'finish' | null>(null);
    const [reasons, setReasons] = useState<FailureReason[]>([]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const notifications = useToastNotifications();
    const load = useCallback(
        () => api.deliveries({ pageNumber: page, pageSize: 10, keyword, status }),
        [api, page, keyword, status],
    );
    const orders = useWorkflowResource(load);
    const openDetail = async (id: number) => {
        if (detailId === id) {
            setDetailId(null);
            setDetail(null);
            return;
        }
        setDetailId(id);
        setDetail(null);
        setDetailLoading(true);
        setError('');
        try {
            setDetail(await api.delivery(id));
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Không thể tải chi tiết.');
        } finally {
            setDetailLoading(false);
        }
    };
    const openAction = async (id: number, status: DeliveryStatus) => {
        setError('');
        setDetailLoading(true);
        try {
            const [value, catalog] = await Promise.all([
                api.delivery(id),
                status === 'Shipping' ? api.failureReasons() : Promise.resolve([]),
            ]);
            setDetail(value);
            setDetailId(id);
            setReasons(catalog);
            setAction(status === 'Prepared' ? 'start' : 'finish');
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Không thể tải đơn.');
        } finally {
            setDetailLoading(false);
        }
    };
    const submit = async (update: DeliveryUpdate) => {
        if (!detail || busy) return;
        setBusy(true);
        setError('');
        try {
            await api.updateDelivery(detail.orderId, update);
            setDetail(await api.delivery(detail.orderId));
            setAction(null);
            orders.reload();
            notifications.notify(
                update.newStatus === 'Shipping'
                    ? 'Đã bắt đầu giao hàng.'
                    : update.newStatus === 'Completed'
                      ? 'Đã ghi nhận giao hàng thành công.'
                      : 'Đã ghi nhận giao thất bại và báo cho Staff.',
            );
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Không thể cập nhật.');
            orders.reload();
        } finally {
            setBusy(false);
        }
    };
    return {
        orders,
        status,
        keyword,
        page,
        detail,
        detailId,
        detailLoading,
        action,
        reasons,
        busy,
        error,
        notifications,
        openDetail,
        openAction,
        submit,
        setPage,
        setAction,
        setError,
        filter: (value: string) => {
            setStatus(value);
            setPage(1);
            setDetailId(null);
        },
        search: (value: string) => {
            setKeyword(value.trim());
            setPage(1);
            setDetailId(null);
        },
    };
}

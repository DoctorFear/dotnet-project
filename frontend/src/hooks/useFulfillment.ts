import { useCallback, useState } from 'react';
import { useWorkflow } from '../context/WorkflowContext';
import { useWorkflowResource } from './useWorkflowResource';
import { useToastNotifications } from './useToastNotifications';
import type { PackingDetail, PackingQuery, PackingVerification } from '../types/workflow';

export function useFulfillment() {
    const { api } = useWorkflow();
    const [query, setQuery] = useState<PackingQuery>({ pageNumber: 1, pageSize: 10 });
    const load = useCallback(() => api.packingOrders(query), [api, query]);
    const orders = useWorkflowResource(load);
    const [selected, setSelected] = useState<PackingDetail | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [busy, setBusy] = useState(false);
    const [waveBusy, setWaveBusy] = useState(false);
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
    const save = async (reason?: string, verification?: PackingVerification) => {
        if (!selected || busy) return false;
        setBusy(true);
        setError('');
        try {
            if (reason !== undefined) {
                await api.packingIssue(selected.orderId, reason);
                setSelected(await api.packingDetail(selected.orderId));
            } else {
                const packedOrderId = selected.orderId;
                if (!verification) {
                    throw new Error('Vui lòng quét đủ mã và xác nhận ngoại quan từng cuốn trước khi đóng gói.');
                }
                await api.confirmPacking(packedOrderId, verification);
                try {
                    setSelected(await api.packingDetail(packedOrderId));
                } catch {
                    setSelected(null);
                }
            }
            orders.reload();
            notifications.notify(
                reason === undefined
                    ? 'Đã đóng gói xong và tạo phiếu giao hàng. Đơn đang chờ phân công Shipper.'
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
    const loadWaveDetails = async (orderIds: number[]) => {
        const uniqueIds = [...new Set(orderIds)];
        if (uniqueIds.length === 0 || waveBusy) return null;
        setWaveBusy(true);
        setError('');
        try {
            const results = await Promise.allSettled(
                uniqueIds.map(async (id) => ({ id, detail: await api.packingDetail(id) })),
            );
            const details: PackingDetail[] = [];
            const excludedCodes: string[] = [];
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    excludedCodes.push(`ORD-${String(uniqueIds[index]).padStart(8, '0')}`);
                    return;
                }
                const { id, detail } = result.value;
                const stillPending = detail.canConfirmPacking !== false &&
                    (detail.status === undefined || detail.status === 2);
                if (stillPending) {
                    details.push(detail);
                } else {
                    excludedCodes.push(
                        detail.orderCode?.trim() || `ORD-${String(id).padStart(8, '0')}`,
                    );
                }
            });
            if (excludedCodes.length > 0) {
                setError(
                    `Đã loại ${excludedCodes.join(', ')} khỏi đợt in vì đơn không còn chờ đóng gói hoặc không thể xác minh. Danh sách đang được làm mới.`,
                );
                orders.reload();
            }
            if (details.length === 0) return null;
            return details;
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Không thể tải dữ liệu đợt lấy hàng.');
            orders.reload();
            return null;
        } finally {
            setWaveBusy(false);
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
        waveBusy,
        error,
        setError,
        save,
        loadWaveDetails,
        notifications,
    };
}

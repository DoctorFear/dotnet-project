import { useCallback, useState } from 'react';
import { useWorkflow } from '../context/WorkflowContext';
import { useWorkflowResource } from './useWorkflowResource';
import { useToastNotifications } from './useToastNotifications';
import type { OrderPoints, PointPreview } from '../types/workflow';

export function useLoyalty() {
    const { api } = useWorkflow();
    const [page, setPage] = useState(1);
    const load = useCallback(async () => {
        const [balance, tiers, history] = await Promise.all([
            api.balance(),
            api.tiers(),
            api.pointHistory(page, 10),
        ]);
        return { balance, tiers: [...tiers].sort((a, b) => a.minSpending - b.minSpending), history };
    }, [api, page]);
    const resource = useWorkflowResource(load);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [receipt, setReceipt] = useState<OrderPoints | null>(null);
    const [previewResult, setPreviewResult] = useState<PointPreview | null>(null);
    const notifications = useToastNotifications();
    const preview = async (points: number, amount: number) => {
        setBusy(true);
        setError('');
        setPreviewResult(null);
        try {
            setPreviewResult(await api.previewPoints(points, amount));
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Không thể tính mức giảm.');
        } finally {
            setBusy(false);
        }
    };
    const openReceipt = async (id: number) => {
        setBusy(true);
        setError('');
        try {
            setReceipt(await api.orderPoints(id));
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Không thể tải thông tin đơn.');
        } finally {
            setBusy(false);
        }
    };
    const confirm = async () => {
        if (!receipt || busy) return;
        setBusy(true);
        setError('');
        try {
            await api.confirmReceipt(receipt.orderId);
            setReceipt(null);
            resource.reload();
            notifications.notify('Đã xác nhận nhận hàng và chuyển điểm của đơn thành khả dụng.');
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Không thể xác nhận nhận hàng.');
        } finally {
            setBusy(false);
        }
    };
    return {
        resource,
        page,
        setPage,
        busy,
        error,
        setError,
        receipt,
        setReceipt,
        previewResult,
        setPreviewResult,
        preview,
        openReceipt,
        confirm,
        notifications,
    };
}

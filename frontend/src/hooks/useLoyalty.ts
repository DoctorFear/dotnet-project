import { useCallback, useEffect, useState } from 'react';
import { useWorkflow } from '../context/WorkflowContext';
import { useUser } from '../context/UserContext';
import { useWorkflowResource } from './useWorkflowResource';
import { useToastNotifications } from './useToastNotifications';
import type {
    OrderPoints,
    PointHistoryQuery,
    PointPreview,
    PointTransactionType,
} from '../types/workflow';

type HistoryFilters = Pick<PointHistoryQuery, 'fromDate' | 'toDate' | 'transactionType'>;
const EMPTY_HISTORY_FILTERS: HistoryFilters = {};

export function useLoyalty() {
    const { api } = useWorkflow();
    const { user, updateUser } = useUser();
    const [page, setPage] = useState(1);
    const [historyFilters, setHistoryFilters] = useState<HistoryFilters>(EMPTY_HISTORY_FILTERS);
    const [appliedHistoryFilters, setAppliedHistoryFilters] = useState<HistoryFilters>(EMPTY_HISTORY_FILTERS);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const load = useCallback(async () => {
        const [balance, tiers, history] = await Promise.all([
            api.balance(),
            api.tiers(),
            api.pointHistory({
                pageNumber: page,
                pageSize: 10,
                ...appliedHistoryFilters,
            }),
        ]);
        return { balance, tiers: [...tiers].sort((a, b) => a.minSpending - b.minSpending), history };
    }, [api, appliedHistoryFilters, page]);
    const resource = useWorkflowResource(load);
    const currentPoints = resource.data?.balance.currentPoints;
    const membershipTierName = resource.data?.balance.tierName;

    useEffect(() => {
        if (currentPoints !== undefined && (
            user?.fPoints !== currentPoints || user?.membershipTierName !== membershipTierName
        )) {
            updateUser({ fPoints: currentPoints, membershipTierName });
        }
    }, [currentPoints, membershipTierName, updateUser, user?.fPoints, user?.membershipTierName]);

    const setHistoryFilter = (
        name: keyof HistoryFilters,
        value: string,
    ) => {
        setHistoryFilters((current) => ({
            ...current,
            [name]: value || undefined,
        }));
    };
    const applyHistoryFilters = () => {
        if (
            historyFilters.fromDate &&
            historyFilters.toDate &&
            historyFilters.fromDate > historyFilters.toDate
        ) {
            setError('Ngày bắt đầu không được sau ngày kết thúc.');
            return;
        }
        setError('');
        setPage(1);
        setAppliedHistoryFilters({ ...historyFilters });
    };
    const resetHistoryFilters = () => {
        setError('');
        setPage(1);
        setHistoryFilters(EMPTY_HISTORY_FILTERS);
        setAppliedHistoryFilters(EMPTY_HISTORY_FILTERS);
    };

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
        historyFilters,
        setHistoryFilter,
        applyHistoryFilters,
        resetHistoryFilters,
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

export type LoyaltyPointTransactionType = PointTransactionType;

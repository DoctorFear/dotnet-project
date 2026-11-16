import { useState, useCallback, useEffect } from 'react';
import { refundService } from '../services/refundService';
import type { RefundResponseDto } from '../types/refund';

export const useRefundManagement = () => {
    const [refunds, setRefunds] = useState<RefundResponseDto[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchKeyword, setSearchKeyword] = useState('');

    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [selectedRefundDetail, setSelectedRefundDetail] = useState<RefundResponseDto | null>(null);

    const [confirmOrderId, setConfirmOrderId] = useState<number | null>(null);
    const [isApproving, setIsApproving] = useState(false);
    
    const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' }[]>([]);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const notify = useCallback((message: string, type: 'success' | 'error') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), 3000);
    }, [removeToast]);

    const fetchRefunds = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await refundService.getPagedRefunds(page, pageSize, searchKeyword);
            setRefunds(data.items ?? []);
            setTotalCount(data.totalCount ?? 0);

            const maxPage = Math.max(1, Math.ceil((data.totalCount ?? 0) / pageSize));
            if (page > maxPage) {
                setPage(maxPage);
            }
        } catch (err: any) {
            setError(err.message || 'Không thể tải danh sách hoàn trả.');
        } finally {
            setIsLoading(false);
        }
    }, [page, pageSize, searchKeyword]);

    useEffect(() => {
        fetchRefunds();
    }, [fetchRefunds]);

    const viewRefundDetail = async (orderId: number) => {
        setSelectedOrderId(orderId);
        setIsLoading(true);
        try {
            const detail = await refundService.getRefundByOrderId(orderId);
            setSelectedRefundDetail(detail);
        } catch (err: any) {
            notify(err.message || 'Không thể tải chi tiết hoàn trả.', 'error');
            setSelectedOrderId(null);
        } finally {
            setIsLoading(false);
        }
    };

    const backToList = () => {
        setSelectedOrderId(null);
        setSelectedRefundDetail(null);
        fetchRefunds(); 
    };

    const openApproveModal = (orderId: number) => {
        setConfirmOrderId(orderId);
    };

    const closeApproveModal = () => {
        if (isApproving) return;
        setConfirmOrderId(null);
    };

    const confirmApproveRefund = async () => {
        if (confirmOrderId === null || isApproving) return;

        const targetOrderId = confirmOrderId;
        setIsApproving(true);
        try {
            const res = await refundService.approveRefund(targetOrderId);
            notify(res.message || `Đã duyệt hoàn trả thành công đơn #${targetOrderId}.`, 'success');
            setConfirmOrderId(null);

            if (selectedOrderId) {
                backToList();
            } else {
                await fetchRefunds();
            }
        } catch (err: any) {
            notify(err.message || 'Lỗi khi duyệt hoàn trả.', 'error');
        } finally {
            setIsApproving(false);
        }
    };

    return {
        refunds,
        totalCount,
        isLoading,
        error,
        page,
        pageSize,
        searchKeyword,
        selectedOrderId,
        selectedRefundDetail,
        confirmOrderId,
        isApproving,
        toasts,
        setPage,
        setPageSize,
        setSearchKeyword,
        viewRefundDetail,
        backToList,
        openApproveModal,
        closeApproveModal,
        confirmApproveRefund,
        removeToast,
    };
};
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

    const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' }[]>([]);

    const notify = (message: string, type: 'success' | 'error') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), 3000);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const fetchRefunds = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await refundService.getPagedRefunds(page, pageSize, searchKeyword);
            setRefunds(data.items);
            setTotalCount(data.totalCount);
        } catch (err: any) {
            // apiClient.ts throws an Error with the message directly mapped from the backend
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

    const approveRefund = async (orderId: number) => {
        if (!window.confirm(`Bạn có chắc chắn muốn duyệt hoàn trả cho đơn hàng #${orderId}?`)) return;
        
        try {
            const res = await refundService.approveRefund(orderId);
            notify(res.message || `Đã duyệt hoàn trả thành công đơn #${orderId}.`, 'success');
            
            if (selectedOrderId) {
                backToList();
            } else {
                fetchRefunds();
            }
        } catch (err: any) {
            notify(err.message || 'Lỗi khi duyệt hoàn trả.', 'error');
        }
    };

    return {
        refunds, totalCount, isLoading, error, page, pageSize, searchKeyword,
        selectedOrderId, selectedRefundDetail, toasts,
        setPage, setPageSize, setSearchKeyword,
        viewRefundDetail, backToList, approveRefund, removeToast
    };
};
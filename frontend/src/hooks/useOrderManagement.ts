import { useState, useEffect, useCallback, useMemo } from 'react';
import { getPagedOrdersAdmin, updateOrderStatus, approveReturnOrder } from '../services/orderServiceAdmin';
import { getOrderDetail } from '../services/orderService';
import type { Order } from '../types/order';
import { OrderStatus } from '../types/order';
import type { ToastMessage } from '../components/common/ToastNotification';

export const useOrderManagement = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
    const [searchKeyword, setSearchKeyword] = useState('');

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToasts((prev) => [...prev, { id: Date.now().toString(), message, type }]);
    };

    const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

    const loadOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await getPagedOrdersAdmin(page, pageSize, statusFilter ? Number(statusFilter) : undefined, searchKeyword);
            setOrders(result.items);
            setTotalCount(result.totalCount);
            setError('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu đơn hàng.');
        } finally {
            setIsLoading(false);
        }
    }, [page, pageSize, statusFilter, searchKeyword]);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    const openOrderDetail = async (id: number) => {
        try {
            const detail = await getOrderDetail(id);
            setSelectedOrder(detail);
            setIsDetailModalOpen(true);
        } catch (err) {
            addToast('Không thể tải chi tiết đơn hàng.', 'error');
        }
    };

    const closeDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedOrder(null);
    };

    const changeOrderStatus = async (id: number, newStatus: OrderStatus) => {
        try {
            await updateOrderStatus(id, newStatus);
            addToast(`Cập nhật trạng thái thành công.`, 'success');
            loadOrders();
            if (selectedOrder && selectedOrder.id === id) {
                setSelectedOrder({ ...selectedOrder, status: newStatus });
            }
        } catch (err) {
            addToast(err instanceof Error ? err.message : 'Lỗi cập nhật trạng thái.', 'error');
        }
    };

    const approveRefund = async (id: number) => {
        try {
            await approveReturnOrder(id);
            addToast(`Đã duyệt yêu cầu hoàn trả thành công.`, 'success');
            loadOrders();
            if (selectedOrder && selectedOrder.id === id) {
                setSelectedOrder({ ...selectedOrder, status: OrderStatus.ReturnApproved });
            }
        } catch (err) {
            addToast(err instanceof Error ? err.message : 'Lỗi duyệt hoàn trả.', 'error');
        }
    };

    return {
        orders, totalCount, isLoading, error, page, pageSize, statusFilter, searchKeyword,
        selectedOrder, isDetailModalOpen, toasts,
        setPage, setPageSize, setStatusFilter, setSearchKeyword,
        openOrderDetail, closeDetailModal, changeOrderStatus, approveRefund, removeToast, loadOrders
    };
};
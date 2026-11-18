import { useEffect, useState } from 'react';
import { shipperService } from '../services/shipperService';
import type {
    PhysicalOrderSummaryDto,
    OrderTrackingDetailDto,
    ShipperDto,
} from '../types/shipper';

export const useOrderDispatch = (isActive: boolean) => {
    const [dispatchOrders, setDispatchOrders] = useState<PhysicalOrderSummaryDto[]>([]);
    const [shippers, setShippers] = useState<ShipperDto[]>([]);
    const [dispatchKeyword, setDispatchKeyword] = useState('');
    const [dispatchStatusFilter, setDispatchStatusFilter] = useState('');
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [assignOrderId, setAssignOrderId] = useState<number>(0);
    const [assignShipperId, setAssignShipperId] = useState<number>(0);
    const [trackingModalData, setTrackingModalData] = useState<OrderTrackingDetailDto | null>(null);
    const [dispatchNotice, setDispatchNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(
        null
    );

    const showDispatchNotice = (text: string, type: 'success' | 'error' = 'success') => {
        setDispatchNotice({ text, type });
        window.setTimeout(() => setDispatchNotice(null), 3500);
    };

    const loadDispatchData = async () => {
        try {
            const [orderList, shipperList] = await Promise.all([
                shipperService.getPhysicalOrders(dispatchStatusFilter, dispatchKeyword),
                shipperService.getShippers(),
            ]);
            setDispatchOrders(orderList);
            setShippers(shipperList);
            if (shipperList.length > 0 && assignShipperId === 0) {
                const activeShipper = shipperList.find((s) => s.status === 'Active') ?? shipperList[0];
                setAssignShipperId(activeShipper.id);
            }
            if (orderList.length > 0 && assignOrderId === 0) {
                setAssignOrderId(orderList[0].orderId);
            }
        } catch (err) {
            showDispatchNotice(
                err instanceof Error ? err.message : 'Không thể tải dữ liệu điều phối vận đơn',
                'error'
            );
        }
    };

    useEffect(() => {
        if (isActive) {
            void loadDispatchData();
        }
    }, [isActive]);

    const handleAssignShipperSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await shipperService.assignOrderToShipper(
                Number(assignOrderId),
                Number(assignShipperId)
            );
            showDispatchNotice(res.message, 'success');
            setIsAssignModalOpen(false);
            await loadDispatchData();
        } catch (err) {
            showDispatchNotice(err instanceof Error ? err.message : 'Lỗi phân công Shipper', 'error');
        }
    };

    const handleUnassignShipper = async (orderId: number) => {
        try {
            const res = await shipperService.unassignOrder(orderId);
            showDispatchNotice(res.message, 'success');
            await loadDispatchData();
        } catch (err) {
            showDispatchNotice(err instanceof Error ? err.message : 'Lỗi hủy phân công Shipper', 'error');
        }
    };

    const handleOpenTrackingTimeline = async (orderId: number) => {
        try {
            const detail = await shipperService.getOrderTracking(orderId);
            setTrackingModalData(detail);
        } catch (err) {
            showDispatchNotice(err instanceof Error ? err.message : 'Lỗi tải tiến trình vận đơn', 'error');
        }
    };

    return {
        dispatchOrders,
        shippers,
        dispatchKeyword,
        setDispatchKeyword,
        dispatchStatusFilter,
        setDispatchStatusFilter,
        isAssignModalOpen,
        setIsAssignModalOpen,
        assignOrderId,
        setAssignOrderId,
        assignShipperId,
        setAssignShipperId,
        trackingModalData,
        setTrackingModalData,
        dispatchNotice,
        loadDispatchData,
        handleAssignShipperSubmit,
        handleUnassignShipper,
        handleOpenTrackingTimeline,
    };
};

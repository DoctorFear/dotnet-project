import { useEffect, useState } from 'react';
import { shipperService } from '../services/shipperService';
import type { ShipperDto, PhysicalOrderSummaryDto } from '../types/shipper';

export const useStaffShipperManagement = () => {
    const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [shippers, setShippers] = useState<ShipperDto[]>([]);
    const [shipperAreaFilter, setShipperAreaFilter] = useState('');
    const [shipperStatusFilter, setShipperStatusFilter] = useState('');

    // Modal thêm/sửa Shipper
    const [isShipperModalOpen, setIsShipperModalOpen] = useState(false);
    const [editingShipperId, setEditingShipperId] = useState<number | null>(null);
    const [shipperForm, setShipperForm] = useState({
        name: '',
        phone: '',
        area: '',
        status: 'Active',
        maxConcurrentOrders: 5,
    });

    // Xem danh sách đơn của 1 Shipper
    const [selectedShipperOrders, setSelectedShipperOrders] = useState<{
        shipper: ShipperDto;
        orders: PhysicalOrderSummaryDto[];
    } | null>(null);

    const notify = (text: string, type: 'success' | 'error' = 'success') => {
        setToast({ text, type });
        window.setTimeout(() => setToast(null), 3800);
    };

    const loadShippers = async () => {
        try {
            const list = await shipperService.getShippers(shipperStatusFilter, shipperAreaFilter);
            setShippers(list);
        } catch (err) {
            notify(err instanceof Error ? err.message : 'Không thể tải danh sách Shipper', 'error');
        }
    };

    useEffect(() => {
        void loadShippers();
    }, []);

    const openCreateShipperModal = () => {
        setEditingShipperId(null);
        setShipperForm({
            name: '',
            phone: '',
            area: '',
            status: 'Active',
            maxConcurrentOrders: 5,
        });
        setIsShipperModalOpen(true);
    };

    const openEditShipperModal = (s: ShipperDto) => {
        setEditingShipperId(s.id);
        setShipperForm({
            name: s.name,
            phone: s.phone,
            area: s.area,
            status: s.status,
            maxConcurrentOrders: s.maxConcurrentOrders,
        });
        setIsShipperModalOpen(true);
    };

    const handleSaveShipper = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingShipperId) {
                await shipperService.updateShipper(editingShipperId, shipperForm);
                notify('Đã cập nhật thông tin Shipper thành công.');
            } else {
                await shipperService.createShipper(shipperForm);
                notify('Đã thêm Shipper mới vào đội ngũ vận chuyển.');
            }
            setIsShipperModalOpen(false);
            await loadShippers();
        } catch (err) {
            notify(err instanceof Error ? err.message : 'Lỗi lưu thông tin Shipper', 'error');
        }
    };

    const handleChangeShipperStatus = async (shipperId: number, status: string) => {
        try {
            await shipperService.updateShipperStatus(shipperId, status);
            notify(`Đã chuyển trạng thái Shipper #${shipperId} sang ${status}.`);
            await loadShippers();
        } catch (err) {
            notify(err instanceof Error ? err.message : 'Lỗi đổi trạng thái Shipper', 'error');
        }
    };

    const handleViewShipperOrders = async (shipper: ShipperDto) => {
        try {
            const orders = await shipperService.getOrdersByShipper(shipper.id);
            setSelectedShipperOrders({ shipper, orders });
        } catch (err) {
            notify(err instanceof Error ? err.message : 'Lỗi tải danh sách đơn của Shipper', 'error');
        }
    };

    const handleUnassignOrder = async (orderId: number) => {
        try {
            const res = await shipperService.unassignOrder(orderId);
            notify(res.message);
            await loadShippers();
            if (selectedShipperOrders) {
                const updated = await shipperService.getOrdersByShipper(
                    selectedShipperOrders.shipper.id
                );
                setSelectedShipperOrders({ ...selectedShipperOrders, orders: updated });
            }
        } catch (err) {
            notify(err instanceof Error ? err.message : 'Lỗi thu hồi phân công', 'error');
        }
    };

    return {
        toast,
        shippers,
        shipperAreaFilter,
        setShipperAreaFilter,
        shipperStatusFilter,
        setShipperStatusFilter,
        isShipperModalOpen,
        setIsShipperModalOpen,
        editingShipperId,
        shipperForm,
        setShipperForm,
        selectedShipperOrders,
        setSelectedShipperOrders,
        loadShippers,
        openCreateShipperModal,
        openEditShipperModal,
        handleSaveShipper,
        handleChangeShipperStatus,
        handleViewShipperOrders,
        handleUnassignOrder,
    };
};

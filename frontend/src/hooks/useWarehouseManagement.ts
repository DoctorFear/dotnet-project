import { useEffect, useState } from 'react';
import { warehouseService } from '../services/warehouseService';
import type {
    SupplierDto,
    PurchaseOrderDto,
    StockAlertDto,
    StockMovementDto,
    SimpleBookOption,
} from '../types/warehouse';

export type WarehouseTabKey = 'suppliers' | 'purchase-orders' | 'alerts';

export const useWarehouseManagement = () => {
    const [activeTab, setActiveTab] = useState<WarehouseTabKey>('suppliers');
    const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const notify = (text: string, type: 'success' | 'error' = 'success') => {
        setToast({ text, type });
        window.setTimeout(() => setToast(null), 3800);
    };

    // Data states
    const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderDto[]>([]);
    const [books, setBooks] = useState<SimpleBookOption[]>([]);
    const [alerts, setAlerts] = useState<StockAlertDto[]>([]);
    const [movements, setMovements] = useState<StockMovementDto[]>([]);

    // Filter states
    const [supplierKeyword, setSupplierKeyword] = useState('');
    const [supplierStatusFilter, setSupplierStatusFilter] = useState('');
    const [poKeyword, setPoKeyword] = useState('');
    const [poStatusFilter, setPoStatusFilter] = useState('');
    const [movementTypeFilter, setMovementTypeFilter] = useState('');

    // Modal states: Supplier
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [editingSupplierId, setEditingSupplierId] = useState<number | null>(null);
    const [supplierForm, setSupplierForm] = useState({
        name: '',
        taxCode: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        status: 'Active',
    });

    // Modal states: Create Purchase Order
    const [isCreatePoModalOpen, setIsCreatePoModalOpen] = useState(false);
    const [poFormSupplierId, setPoFormSupplierId] = useState<number>(0);
    const [poFormNotes, setPoFormNotes] = useState('');
    const [poFormItems, setPoFormItems] = useState<
        { bookId: number; orderedQuantity: number; unitPrice: number }[]
    >([{ bookId: 1, orderedQuantity: 10, unitPrice: 85000 }]);

    // Modal states: Inspect & Approve / Cancel Purchase Order
    const [inspectingPo, setInspectingPo] = useState<PurchaseOrderDto | null>(null);
    const [receivedQtyMap, setReceivedQtyMap] = useState<Record<number, number>>({});
    const [approveNotes, setApproveNotes] = useState('');
    const [cancellingPo, setCancellingPo] = useState<PurchaseOrderDto | null>(null);
    const [cancelReasonText, setCancelReasonText] = useState('');

    // Modal states: Threshold
    const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false);
    const [thresholdBookId, setThresholdBookId] = useState<number>(1);
    const [thresholdValue, setThresholdValue] = useState<number>(10);

    const loadOverviewData = async () => {
        try {
            const [supList, poList, alertList, moveList, bookList] = await Promise.all([
                warehouseService.getSuppliers(supplierKeyword, supplierStatusFilter),
                warehouseService.getPurchaseOrders(poStatusFilter, undefined, poKeyword),
                warehouseService.getActiveAlerts(),
                warehouseService.getStockMovements(undefined, movementTypeFilter),
                warehouseService.getBooksForSelect(),
            ]);

            setSuppliers(supList);
            setPurchaseOrders(poList);
            setAlerts(alertList);
            setMovements(moveList);
            setBooks(bookList);

            if (supList.length > 0 && poFormSupplierId === 0) {
                const activeSup = supList.find((s) => s.status === 'Active') ?? supList[0];
                setPoFormSupplierId(activeSup.id);
            }
            if (bookList.length > 0 && thresholdBookId === 1) {
                setThresholdBookId(bookList[0].id);
            }
        } catch (err) {
            notify(err instanceof Error ? err.message : 'Không thể tải dữ liệu phân hệ Kho', 'error');
        }
    };

    useEffect(() => {
        void loadOverviewData();
    }, []);

    // Supplier handlers
    const filterSuppliers = async () => {
        try {
            const list = await warehouseService.getSuppliers(supplierKeyword, supplierStatusFilter);
            setSuppliers(list);
        } catch (err) {
            notify(err instanceof Error ? err.message : 'Lỗi lọc Nhà cung cấp', 'error');
        }
    };

    const openCreateSupplierModal = () => {
        setEditingSupplierId(null);
        setSupplierForm({
            name: '',
            taxCode: '',
            contactPerson: '',
            phone: '',
            email: '',
            address: '',
            status: 'Active',
        });
        setIsSupplierModalOpen(true);
    };

    const openEditSupplierModal = (s: SupplierDto) => {
        setEditingSupplierId(s.id);
        setSupplierForm({
            name: s.name,
            taxCode: s.taxCode,
            contactPerson: s.contactPerson,
            phone: s.phone,
            email: s.email,
            address: s.address,
            status: s.status,
        });
        setIsSupplierModalOpen(true);
    };

    const handleSaveSupplier = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingSupplierId) {
                await warehouseService.updateSupplier(editingSupplierId, supplierForm);
                notify('Đã cập nhật thông tin Nhà cung cấp thành công.');
            } else {
                await warehouseService.createSupplier(supplierForm);
                notify('Đã thêm Nhà cung cấp mới thành công.');
            }
            setIsSupplierModalOpen(false);
            await filterSuppliers();
        } catch (err) {
            notify(err instanceof Error ? err.message : 'Lỗi lưu Nhà cung cấp', 'error');
        }
    };

    const handleToggleSupplierStatus = async (s: SupplierDto) => {
        const nextStatus = s.status === 'Active' ? 'Inactive' : 'Active';
        try {
            await warehouseService.updateSupplierStatus(s.id, nextStatus);
            notify(
                `Đã chuyển trạng thái hợp tác của "${s.name}" sang ${
                    nextStatus === 'Active' ? 'Đang hợp tác' : 'Ngừng hợp tác'
                }.`
            );
            await filterSuppliers();
        } catch (err) {
            notify(err instanceof Error ? err.message : 'Lỗi đổi trạng thái NCC', 'error');
        }
    };

    // Purchase Order handlers
    const filterPurchaseOrders = async () => {
        try {
            const list = await warehouseService.getPurchaseOrders(poStatusFilter, undefined, poKeyword);
            setPurchaseOrders(list);
        } catch (err) {
            notify(err instanceof Error ? err.message : 'Lỗi lọc Phiếu nhập kho', 'error');
        }
    };

    const openCreatePoModal = (prefillBookId?: number) => {
        const defaultBook = prefillBookId ? books.find((b) => b.id === prefillBookId) : books[0];
        setPoFormNotes('');
        setPoFormItems([
            {
                bookId: defaultBook?.id ?? 1,
                orderedQuantity: 15,
                unitPrice: defaultBook?.physicalPrice ?? 85000,
            },
        ]);
        setIsCreatePoModalOpen(true);
    };

    const handleCreatePurchaseOrder = async (isDraft: boolean) => {
        try {
            const created = await warehouseService.createPurchaseOrder({
                supplierId: Number(poFormSupplierId),
                notes: poFormNotes,
                isDraft,
                items: poFormItems.map((i) => ({
                    bookId: Number(i.bookId),
                    orderedQuantity: Number(i.orderedQuantity),
                    unitPrice: Number(i.unitPrice),
                })),
            });
            notify(`Đã lập phiếu nhập kho ${created.code} (${created.status}) thành công!`);
            setIsCreatePoModalOpen(false);
            await filterPurchaseOrders();
        } catch (err) {
            notify(err instanceof Error ? err.message : 'Lỗi lập phiếu nhập kho', 'error');
        }
    };

    const openInspectPoModal = (po: PurchaseOrderDto) => {
        const map: Record<number, number> = {};
        po.items.forEach((i) => {
            map[i.bookId] = i.receivedQuantity > 0 ? i.receivedQuantity : i.orderedQuantity;
        });
        setReceivedQtyMap(map);
        setApproveNotes('');
        setInspectingPo(po);
    };

    const handleApprovePurchaseOrder = async () => {
        if (!inspectingPo) return;
        try {
            const receivedItems = inspectingPo.items.map((i) => ({
                bookId: i.bookId,
                receivedQuantity:
                    receivedQtyMap[i.bookId] !== undefined ? receivedQtyMap[i.bookId] : i.orderedQuantity,
            }));
            const res = await warehouseService.approvePurchaseOrder(inspectingPo.id, {
                notes: approveNotes,
                receivedItems,
            });
            notify(res.message);
            setInspectingPo(null);
            await loadOverviewData();
        } catch (err) {
            notify(err instanceof Error ? err.message : 'Lỗi duyệt phiếu nhập kho', 'error');
        }
    };

    const handleConfirmCancelPo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cancellingPo) return;
        try {
            const res = await warehouseService.cancelPurchaseOrder(cancellingPo.id, cancelReasonText);
            notify(res.message);
            setCancellingPo(null);
            setCancelReasonText('');
            await filterPurchaseOrders();
        } catch (err) {
            notify(err instanceof Error ? err.message : 'Lỗi hủy phiếu nhập kho', 'error');
        }
    };

    // Inventory Alerts & Movements handlers
    const handleScanAlerts = async () => {
        try {
            const list = await warehouseService.scanStockAlerts();
            setAlerts(list);
            notify(`Quét tồn kho hoàn tất! Phát hiện ${list.length} đầu sách chạm ngưỡng cảnh báo.`);
        } catch (err) {
            notify(err instanceof Error ? err.message : 'Lỗi quét cảnh báo tồn kho', 'error');
        }
    };

    const handleResolveAlert = async (alertId: number) => {
        try {
            const res = await warehouseService.resolveAlert(alertId);
            notify(res.message);
            const list = await warehouseService.getActiveAlerts();
            setAlerts(list);
        } catch (err) {
            notify(err instanceof Error ? err.message : 'Lỗi đánh dấu xử lý cảnh báo', 'error');
        }
    };

    const handleUpdateThreshold = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await warehouseService.updateThreshold(Number(thresholdBookId), Number(thresholdValue));
            setIsThresholdModalOpen(false);
            const [list, bookList] = await Promise.all([
                warehouseService.scanStockAlerts(),
                warehouseService.getBooksForSelect(),
            ]);
            setAlerts(list);
            setBooks(bookList);
            notify(
                `Đã cập nhật ngưỡng tồn kho tối thiểu thành ${thresholdValue} và quét lại cảnh báo (${list.length} cảnh báo đang active)!`
            );
        } catch (err) {
            notify(err instanceof Error ? err.message : 'Lỗi cập nhật ngưỡng tồn kho', 'error');
        }
    };

    const handleFilterMovements = async (typeVal: string) => {
        setMovementTypeFilter(typeVal);
        try {
            const moveList = await warehouseService.getStockMovements(undefined, typeVal);
            setMovements(moveList);
        } catch (err) {
            notify(err instanceof Error ? err.message : 'Lỗi lọc biến động kho', 'error');
        }
    };

    return {
        activeTab,
        setActiveTab,
        toast,
        suppliers,
        purchaseOrders,
        books,
        alerts,
        movements,
        supplierKeyword,
        setSupplierKeyword,
        supplierStatusFilter,
        setSupplierStatusFilter,
        poKeyword,
        setPoKeyword,
        poStatusFilter,
        setPoStatusFilter,
        movementTypeFilter,
        isSupplierModalOpen,
        setIsSupplierModalOpen,
        editingSupplierId,
        supplierForm,
        setSupplierForm,
        isCreatePoModalOpen,
        setIsCreatePoModalOpen,
        poFormSupplierId,
        setPoFormSupplierId,
        poFormNotes,
        setPoFormNotes,
        poFormItems,
        setPoFormItems,
        inspectingPo,
        setInspectingPo,
        receivedQtyMap,
        setReceivedQtyMap,
        approveNotes,
        setApproveNotes,
        cancellingPo,
        setCancellingPo,
        cancelReasonText,
        setCancelReasonText,
        isThresholdModalOpen,
        setIsThresholdModalOpen,
        thresholdBookId,
        setThresholdBookId,
        thresholdValue,
        setThresholdValue,
        filterSuppliers,
        openCreateSupplierModal,
        openEditSupplierModal,
        handleSaveSupplier,
        handleToggleSupplierStatus,
        filterPurchaseOrders,
        openCreatePoModal,
        handleCreatePurchaseOrder,
        openInspectPoModal,
        handleApprovePurchaseOrder,
        handleConfirmCancelPo,
        handleScanAlerts,
        handleResolveAlert,
        handleUpdateThreshold,
        handleFilterMovements,
    };
};

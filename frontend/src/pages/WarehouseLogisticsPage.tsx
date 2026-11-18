import React, { useEffect, useState } from 'react';
import {
    Building2,
    FileSpreadsheet,
    AlertTriangle,
    Truck,
    Plus,
    Search,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Edit3,
    Power,
    Eye,
    History,
    ShieldAlert,
    SlidersHorizontal,
    UserCheck,
    X,
} from 'lucide-react';
import AdminLayout from '../components/layout/admin/AdminLayout';
import {
    warehouseLogisticsApi,
    type SupplierDto,
    type PurchaseOrderDto,
    type StockAlertDto,
    type StockMovementDto,
    type ShipperDto,
    type PhysicalOrderSummaryDto,
    type SimpleBookOption,
} from '../services/warehouseLogisticsApi';
import styles from './WarehouseLogisticsPage.module.css';

type TabKey = 'suppliers' | 'purchase-orders' | 'alerts' | 'shippers';

export const WarehouseLogisticsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabKey>('suppliers');
    const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const notify = (text: string, type: 'success' | 'error' = 'success') => {
        setToast({ text, type });
        window.setTimeout(() => setToast(null), 3800);
    };

    // ==================== DATA STATES ====================
    const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderDto[]>([]);
    const [books, setBooks] = useState<SimpleBookOption[]>([]);
    const [alerts, setAlerts] = useState<StockAlertDto[]>([]);
    const [movements, setMovements] = useState<StockMovementDto[]>([]);
    const [shippers, setShippers] = useState<ShipperDto[]>([]);
    const [physicalOrders, setPhysicalOrders] = useState<PhysicalOrderSummaryDto[]>([]);

    // ==================== FILTER STATES ====================
    const [supplierKeyword, setSupplierKeyword] = useState('');
    const [supplierStatusFilter, setSupplierStatusFilter] = useState('');

    const [poKeyword, setPoKeyword] = useState('');
    const [poStatusFilter, setPoStatusFilter] = useState('');

    const [movementTypeFilter, setMovementTypeFilter] = useState('');

    const [shipperAreaFilter, setShipperAreaFilter] = useState('');
    const [shipperStatusFilter, setShipperStatusFilter] = useState('');

    // ==================== MODAL STATES ====================
    // 1. Supplier Modal
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

    // 2. Create Purchase Order Modal
    const [isCreatePoModalOpen, setIsCreatePoModalOpen] = useState(false);
    const [poFormSupplierId, setPoFormSupplierId] = useState<number>(0);
    const [poFormNotes, setPoFormNotes] = useState('');
    const [poFormItems, setPoFormItems] = useState<
        { bookId: number; orderedQuantity: number; unitPrice: number }[]
    >([{ bookId: 1, orderedQuantity: 10, unitPrice: 85000 }]);

    // 3. Inspect & Approve Purchase Order Modal
    const [inspectingPo, setInspectingPo] = useState<PurchaseOrderDto | null>(null);
    const [receivedQtyMap, setReceivedQtyMap] = useState<Record<number, number>>({});
    const [approveNotes, setApproveNotes] = useState('');
    const [cancellingPo, setCancellingPo] = useState<PurchaseOrderDto | null>(null);
    const [cancelReasonText, setCancelReasonText] = useState('');

    // 4. Threshold Modal
    const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false);
    const [thresholdBookId, setThresholdBookId] = useState<number>(1);
    const [thresholdValue, setThresholdValue] = useState<number>(10);

    // 5. Shipper Modal & Dispatch Modal
    const [isShipperModalOpen, setIsShipperModalOpen] = useState(false);
    const [editingShipperId, setEditingShipperId] = useState<number | null>(null);
    const [shipperForm, setShipperForm] = useState({
        name: '',
        phone: '',
        area: '',
        status: 'Active',
        maxConcurrentOrders: 5,
    });
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [assignOrderId, setAssignOrderId] = useState<number>(0);
    const [assignShipperId, setAssignShipperId] = useState<number>(0);
    const [selectedShipperOrders, setSelectedShipperOrders] = useState<{
        shipper: ShipperDto;
        orders: PhysicalOrderSummaryDto[];
    } | null>(null);

    // ==================== LOAD ALL DATA ====================
    const loadOverviewData = async () => {
        try {
            const [supList, poList, alertList, moveList, shipperList, orderList, bookList] =
                await Promise.all([
                    warehouseLogisticsApi.getSuppliers(supplierKeyword, supplierStatusFilter),
                    warehouseLogisticsApi.getPurchaseOrders(poStatusFilter, undefined, poKeyword),
                    warehouseLogisticsApi.getActiveAlerts(),
                    warehouseLogisticsApi.getStockMovements(undefined, movementTypeFilter),
                    warehouseLogisticsApi.getShippers(shipperStatusFilter, shipperAreaFilter),
                    warehouseLogisticsApi.getPhysicalOrders(),
                    warehouseLogisticsApi.getBooksForSelect(),
                ]);

            setSuppliers(supList);
            setPurchaseOrders(poList);
            setAlerts(alertList);
            setMovements(moveList);
            setShippers(shipperList);
            setPhysicalOrders(orderList);
            setBooks(bookList);

            if (supList.length > 0 && poFormSupplierId === 0) {
                const activeSup = supList.find((s) => s.status === 'Active') ?? supList[0];
                setPoFormSupplierId(activeSup.id);
            }
            if (bookList.length > 0 && thresholdBookId === 1) {
                setThresholdBookId(bookList[0].id);
            }
            if (shipperList.length > 0 && assignShipperId === 0) {
                const activeShipper = shipperList.find((s) => s.status === 'Active') ?? shipperList[0];
                setAssignShipperId(activeShipper.id);
            }
            if (orderList.length > 0 && assignOrderId === 0) {
                setAssignOrderId(orderList[0].orderId);
            }
        } catch (err) {
            notify(err instanceof Error ? err.message : 'Không thể tải dữ liệu phân hệ Kho', 'error');
        }
    };

    useEffect(() => {
        loadOverviewData();
    }, []);

    // ==================== HANDLERS: SUPPLIERS ====================
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
                await warehouseLogisticsApi.updateSupplier(editingSupplierId, supplierForm);
                notify('Đã cập nhật thông tin Nhà cung cấp thành công.');
            } else {
                await warehouseLogisticsApi.createSupplier(supplierForm);
                notify('Đã thêm Nhà cung cấp mới thành công.');
            }
            setIsSupplierModalOpen(false);
            const list = await warehouseLogisticsApi.getSuppliers(supplierKeyword, supplierStatusFilter);
            setSuppliers(list);
        } catch (err) {
            notify(err instanceof Error ? err.message : 'Lỗi lưu Nhà cung cấp', 'error');
        }
    };

    const handleToggleSupplierStatus = async (s: SupplierDto) => {
        const nextStatus = s.status === 'Active' ? 'Inactive' : 'Active';
        try {
            await warehouseLogisticsApi.updateSupplierStatus(s.id, nextStatus);
            notify(
                `Đã chuyển trạng thái hợp tác của "${s.name}" sang ${
                    nextStatus === 'Active' ? 'Đang hợp tác' : 'Ngừng hợp tác'
                }.`
            );
            const list = await warehouseLogisticsApi.getSuppliers(supplierKeyword, supplierStatusFilter);
            setSuppliers(list);
        } catch (err) {
            notify(err instanceof Error ? err.message : 'Lỗi đổi trạng thái NCC', 'error');
        }
    };

    // ==================== HANDLERS: PURCHASE ORDERS ====================
    const openCreatePoModal = (prefillBookId?: number) => {
        const defaultBook = prefillBookId
            ? books.find((b) => b.id === prefillBookId)
            : books[0];
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
            const created = await warehouseLogisticsApi.createPurchaseOrder({
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
            const list = await warehouseLogisticsApi.getPurchaseOrders(poStatusFilter, undefined, poKeyword);
            setPurchaseOrders(list);
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
            const res = await warehouseLogisticsApi.approvePurchaseOrder(inspectingPo.id, {
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
            const res = await warehouseLogisticsApi.cancelPurchaseOrder(cancellingPo.id, cancelReasonText);
            notify(res.message);
            setCancellingPo(null);
            setCancelReasonText('');
            const list = await warehouseLogisticsApi.getPurchaseOrders(poStatusFilter, undefined, poKeyword);
            setPurchaseOrders(list);
        } catch (err) {
            notify(err instanceof Error ? err.message : 'Lỗi hủy phiếu nhập kho', 'error');
        }
    };

    // ==================== HANDLERS: INVENTORY ALERTS ====================
    const handleScanAlerts = async () => {
        try {
            const list = await warehouseLogisticsApi.scanStockAlerts();
            setAlerts(list);
            notify(`Quét tồn kho hoàn tất! Phát hiện ${list.length} đầu sách chạm ngưỡng cảnh báo.`);
        } catch (err) {
            notify(err instanceof Error ? err.message : 'Lỗi quét cảnh báo tồn kho', 'error');
        }
    };

    const handleResolveAlert = async (alertId: number) => {
        try {
            const res = await warehouseLogisticsApi.resolveAlert(alertId);
            notify(res.message);
            const list = await warehouseLogisticsApi.getActiveAlerts();
            setAlerts(list);
        } catch (err) {
            notify(err instanceof Error ? err.message : 'Lỗi đánh dấu xử lý cảnh báo', 'error');
        }
    };

    const handleUpdateThreshold = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await warehouseLogisticsApi.updateThreshold(
                Number(thresholdBookId),
                Number(thresholdValue)
            );
            setIsThresholdModalOpen(false);
            const [list, bookList] = await Promise.all([
                warehouseLogisticsApi.scanStockAlerts(),
                warehouseLogisticsApi.getBooksForSelect(),
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

    // ==================== HANDLERS: SHIPPERS & DISPATCH ====================
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
                await warehouseLogisticsApi.updateShipper(editingShipperId, shipperForm);
                notify('Đã cập nhật thông tin Shipper thành công.');
            } else {
                await warehouseLogisticsApi.createShipper(shipperForm);
                notify('Đã thêm Shipper mới vào đội ngũ vận chuyển.');
            }
            setIsShipperModalOpen(false);
            const list = await warehouseLogisticsApi.getShippers(shipperStatusFilter, shipperAreaFilter);
            setShippers(list);
        } catch (err) {
            notify(err instanceof Error ? err.message : 'Lỗi lưu thông tin Shipper', 'error');
        }
    };

    const handleChangeShipperStatus = async (shipperId: number, status: string) => {
        try {
            await warehouseLogisticsApi.updateShipperStatus(shipperId, status);
            notify(`Đã chuyển trạng thái Shipper #${shipperId} sang ${status}.`);
            const list = await warehouseLogisticsApi.getShippers(shipperStatusFilter, shipperAreaFilter);
            setShippers(list);
        } catch (err) {
            notify(err instanceof Error ? err.message : 'Lỗi đổi trạng thái Shipper', 'error');
        }
    };

    const handleAssignShipper = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await warehouseLogisticsApi.assignOrderToShipper(
                Number(assignOrderId),
                Number(assignShipperId)
            );
            notify(res.message);
            setIsAssignModalOpen(false);
            await loadOverviewData();
        } catch (err) {
            notify(err instanceof Error ? err.message : 'Lỗi phân công vận đơn', 'error');
        }
    };

    const handleUnassignOrder = async (orderId: number) => {
        try {
            const res = await warehouseLogisticsApi.unassignOrder(orderId);
            notify(res.message);
            await loadOverviewData();
            if (selectedShipperOrders) {
                const updated = await warehouseLogisticsApi.getOrdersByShipper(
                    selectedShipperOrders.shipper.id
                );
                setSelectedShipperOrders({ ...selectedShipperOrders, orders: updated });
            }
        } catch (err) {
            notify(err instanceof Error ? err.message : 'Lỗi thu hồi phân công', 'error');
        }
    };

    const handleViewShipperOrders = async (shipper: ShipperDto) => {
        try {
            const orders = await warehouseLogisticsApi.getOrdersByShipper(shipper.id);
            setSelectedShipperOrders({ shipper, orders });
        } catch (err) {
            notify(err instanceof Error ? err.message : 'Lỗi tải danh sách đơn của Shipper', 'error');
        }
    };

    // ==================== KPI METRICS ====================
    const activeSuppliersCount = suppliers.filter((s) => s.status === 'Active').length;
    const pendingPoCount = purchaseOrders.filter(
        (po) => po.status === 'Pending' || po.status === 'Draft'
    ).length;

    return (
        <AdminLayout
            activePage="warehouse"
            title="Quản lý Kho sách & Nhập hàng"
            subtitle="Quản trị Nhà cung cấp, Phiếu nhập kho, Cảnh báo tồn kho và Lịch sử biến động kho"
            badge="Warehouse Management"
        >
            {toast && (
                <div
                    className={`${styles.toastBanner} ${
                        toast.type === 'success' ? styles.toastSuccess : styles.toastError
                    }`}
                >
                    {toast.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                    <span>{toast.text}</span>
                </div>
            )}

            <div className={styles.pageStack}>
                {/* 4 KPI Stat Boxes */}
                <div className={styles.statsGrid}>
                    <div className={styles.statBox}>
                        <div className={styles.statInfo}>
                            <span className={styles.statLabel}>Nhà cung cấp hợp tác</span>
                            <span className={styles.statValue}>
                                {activeSuppliersCount} / {suppliers.length}
                            </span>
                            <span className={styles.statSub}>Đối tác cung ứng sách vật lý</span>
                        </div>
                        <div className={styles.statIconWrap}>
                            <Building2 size={20} />
                        </div>
                    </div>

                    <div className={styles.statBox}>
                        <div className={styles.statInfo}>
                            <span className={styles.statLabel}>Phiếu nhập kho</span>
                            <span className={styles.statValue}>{purchaseOrders.length}</span>
                            <span className={styles.statSub}>{pendingPoCount} phiếu đang chờ duyệt</span>
                        </div>
                        <div className={`${styles.statIconWrap} ${styles.success}`}>
                            <FileSpreadsheet size={20} />
                        </div>
                    </div>

                    <div className={styles.statBox}>
                        <div className={styles.statInfo}>
                            <span className={styles.statLabel}>Cảnh báo tồn kho</span>
                            <span className={styles.statValue}>{alerts.length}</span>
                            <span className={styles.statSub}>Đầu sách chạm ngưỡng tối thiểu</span>
                        </div>
                        <div className={`${styles.statIconWrap} ${styles.warning}`}>
                            <AlertTriangle size={20} />
                        </div>
                    </div>

                    <div className={styles.statBox}>
                        <div className={styles.statInfo}>
                            <span className={styles.statLabel}>Biến động kho</span>
                            <span className={styles.statValue}>{movements.length} giao dịch</span>
                            <span className={styles.statSub}>Lịch sử nhập • xuất • kiểm kê</span>
                        </div>
                        <div className={styles.statIconWrap}>
                            <History size={20} />
                        </div>
                    </div>
                </div>

                {/* Main Content Panel */}
                <section className={styles.panel}>
                    <div className={styles.panelHeader}>
                        {/* Tab Navigation (3 Tabs Kho sách) */}
                        <div className={styles.tabRow}>
                            <button
                                type="button"
                                className={`${styles.tabButton} ${
                                    activeTab === 'suppliers' ? styles.active : ''
                                }`}
                                onClick={() => setActiveTab('suppliers')}
                            >
                                <Building2 size={16} />
                                Nhà cung cấp
                                <span className={styles.tabBadgeCount}>{suppliers.length}</span>
                            </button>

                            <button
                                type="button"
                                className={`${styles.tabButton} ${
                                    activeTab === 'purchase-orders' ? styles.active : ''
                                }`}
                                onClick={() => setActiveTab('purchase-orders')}
                            >
                                <FileSpreadsheet size={16} />
                                Phiếu nhập kho & Duyệt nhập
                                <span className={styles.tabBadgeCount}>{purchaseOrders.length}</span>
                            </button>

                            <button
                                type="button"
                                className={`${styles.tabButton} ${
                                    activeTab === 'alerts' ? styles.active : ''
                                }`}
                                onClick={() => setActiveTab('alerts')}
                            >
                                <AlertTriangle size={16} />
                                Cảnh báo & Biến động kho
                                <span className={styles.tabBadgeCount}>{alerts.length}</span>
                            </button>
                        </div>

                        {/* ==================== TOOLBAR PER TAB ==================== */}
                        {activeTab === 'suppliers' && (
                            <div className={styles.toolbar}>
                                <div className={styles.toolbarLeft}>
                                    <div className={styles.searchWrap}>
                                        <Search size={16} />
                                        <input
                                            className={styles.searchInput}
                                            placeholder="Tìm tên NCC, mã số thuế, SĐT..."
                                            value={supplierKeyword}
                                            onChange={(e) => setSupplierKeyword(e.target.value)}
                                        />
                                    </div>
                                    <select
                                        className={styles.filterSelect}
                                        value={supplierStatusFilter}
                                        onChange={(e) => setSupplierStatusFilter(e.target.value)}
                                    >
                                        <option value="">Tất cả trạng thái hợp tác</option>
                                        <option value="Active">Đang hợp tác (Active)</option>
                                        <option value="Inactive">Ngừng hợp tác (Inactive)</option>
                                    </select>
                                    <button
                                        type="button"
                                        className={styles.btnSecondary}
                                        onClick={async () => {
                                            const list = await warehouseLogisticsApi.getSuppliers(
                                                supplierKeyword,
                                                supplierStatusFilter
                                            );
                                            setSuppliers(list);
                                        }}
                                    >
                                        <RefreshCw size={14} /> Lọc dữ liệu
                                    </button>
                                </div>
                                <div className={styles.toolbarRight}>
                                    <button
                                        type="button"
                                        className={styles.btnPrimary}
                                        onClick={openCreateSupplierModal}
                                    >
                                        <Plus size={16} /> Thêm Nhà cung cấp mới
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'purchase-orders' && (
                            <div className={styles.toolbar}>
                                <div className={styles.toolbarLeft}>
                                    <div className={styles.searchWrap}>
                                        <Search size={16} />
                                        <input
                                            className={styles.searchInput}
                                            placeholder="Tìm mã phiếu PO-YYYY-XXX, tên NCC..."
                                            value={poKeyword}
                                            onChange={(e) => setPoKeyword(e.target.value)}
                                        />
                                    </div>
                                    <select
                                        className={styles.filterSelect}
                                        value={poStatusFilter}
                                        onChange={(e) => setPoStatusFilter(e.target.value)}
                                    >
                                        <option value="">Mọi trạng thái phiếu nhập</option>
                                        <option value="Draft">Bản nháp (Draft)</option>
                                        <option value="Pending">Chờ duyệt (Pending)</option>
                                        <option value="Approved">Đã duyệt nhập kho (Approved)</option>
                                        <option value="Cancelled">Đã hủy (Cancelled)</option>
                                    </select>
                                    <button
                                        type="button"
                                        className={styles.btnSecondary}
                                        onClick={async () => {
                                            const list = await warehouseLogisticsApi.getPurchaseOrders(
                                                poStatusFilter,
                                                undefined,
                                                poKeyword
                                            );
                                            setPurchaseOrders(list);
                                        }}
                                    >
                                        <RefreshCw size={14} /> Làm mới
                                    </button>
                                </div>
                                <div className={styles.toolbarRight}>
                                    <button
                                        type="button"
                                        className={styles.btnPrimary}
                                        onClick={() => openCreatePoModal()}
                                    >
                                        <Plus size={16} /> Lập Phiếu nhập kho mới
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'alerts' && (
                            <div className={styles.toolbar}>
                                <div className={styles.toolbarLeft}>
                                    <button
                                        type="button"
                                        className={styles.btnPrimary}
                                        onClick={handleScanAlerts}
                                    >
                                        <ShieldAlert size={16} /> Quét tồn kho & Sinh cảnh báo tự động
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.btnSecondary}
                                        onClick={() => setIsThresholdModalOpen(true)}
                                    >
                                        <SlidersHorizontal size={15} /> Cấu hình ngưỡng tồn tối thiểu
                                    </button>
                                </div>
                                <div className={styles.toolbarRight}>
                                    <select
                                        className={styles.filterSelect}
                                        value={movementTypeFilter}
                                        onChange={async (e) => {
                                            const val = e.target.value;
                                            setMovementTypeFilter(val);
                                            const moveList = await warehouseLogisticsApi.getStockMovements(
                                                undefined,
                                                val
                                            );
                                            setMovements(moveList);
                                        }}
                                    >
                                        <option value="">Tất cả biến động kho</option>
                                        <option value="Import">Nhập kho (Import)</option>
                                        <option value="Sale">Xuất bán (Sale)</option>
                                        <option value="Audit_Adjustment">Cân bằng kiểm kê</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {activeTab === 'shippers' && (
                            <div className={styles.toolbar}>
                                <div className={styles.toolbarLeft}>
                                    <div className={styles.searchWrap}>
                                        <Search size={16} />
                                        <input
                                            className={styles.searchInput}
                                            placeholder="Tìm theo khu vực phụ trách (Quận 1, Thủ Đức...)"
                                            value={shipperAreaFilter}
                                            onChange={(e) => setShipperAreaFilter(e.target.value)}
                                        />
                                    </div>
                                    <select
                                        className={styles.filterSelect}
                                        value={shipperStatusFilter}
                                        onChange={(e) => setShipperStatusFilter(e.target.value)}
                                    >
                                        <option value="">Mọi trạng thái hoạt động</option>
                                        <option value="Active">Đang sẵn sàng (Active)</option>
                                        <option value="Busy">Đang bận giao (Busy)</option>
                                        <option value="Off">Nghỉ ca (Off)</option>
                                    </select>
                                    <button
                                        type="button"
                                        className={styles.btnSecondary}
                                        onClick={async () => {
                                            const list = await warehouseLogisticsApi.getShippers(
                                                shipperStatusFilter,
                                                shipperAreaFilter
                                            );
                                            setShippers(list);
                                        }}
                                    >
                                        <RefreshCw size={14} /> Lọc Shipper
                                    </button>
                                </div>
                                <div className={styles.toolbarRight}>
                                    <button
                                        type="button"
                                        className={styles.btnSuccess}
                                        onClick={() => setIsAssignModalOpen(true)}
                                    >
                                        <UserCheck size={16} /> Điều phối / Phân công Vận đơn
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.btnPrimary}
                                        onClick={openCreateShipperModal}
                                    >
                                        <Plus size={16} /> Thêm Shipper
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ==================== TAB 1 BODY: SUPPLIERS ==================== */}
                    {activeTab === 'suppliers' && (
                        <table className={styles.dataTable}>
                            <thead>
                                <tr>
                                    <th>Mã NCC</th>
                                    <th>Tên Nhà cung cấp & Người liên hệ</th>
                                    <th>Mã số thuế</th>
                                    <th>Điện thoại / Email</th>
                                    <th>Địa chỉ trụ sở</th>
                                    <th>Trạng thái hợp tác</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {suppliers.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className={styles.emptyState}>
                                            Không tìm thấy Nhà cung cấp nào khớp bộ lọc.
                                        </td>
                                    </tr>
                                ) : (
                                    suppliers.map((s) => (
                                        <tr key={s.id}>
                                            <td>
                                                <span className={styles.codeChip}>SUP-{s.id}</span>
                                            </td>
                                            <td>
                                                <div className={styles.cellTitle}>
                                                    <strong>{s.name}</strong>
                                                    <span>Đại diện: {s.contactPerson || 'Chưa cập nhật'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={styles.codeChip}>{s.taxCode}</span>
                                            </td>
                                            <td>
                                                <div className={styles.cellTitle}>
                                                    <strong>{s.phone}</strong>
                                                    <span>{s.email}</span>
                                                </div>
                                            </td>
                                            <td>{s.address}</td>
                                            <td>
                                                <span
                                                    className={`${styles.statusBadge} ${
                                                        s.status === 'Active'
                                                            ? styles.badgeSuccess
                                                            : styles.badgeDanger
                                                    }`}
                                                >
                                                    {s.status === 'Active' ? 'Đang hợp tác' : 'Ngừng hợp tác'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className={styles.actionBtns}>
                                                    <button
                                                        type="button"
                                                        className={styles.btnTable}
                                                        onClick={() => openEditSupplierModal(s)}
                                                    >
                                                        <Edit3 size={13} /> Sửa
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`${styles.btnTable} ${
                                                            s.status === 'Active'
                                                                ? styles.danger
                                                                : styles.success
                                                        }`}
                                                        onClick={() => handleToggleSupplierStatus(s)}
                                                    >
                                                        <Power size={13} />
                                                        {s.status === 'Active'
                                                            ? 'Ngừng hợp tác'
                                                            : 'Hợp tác lại'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}

                    {/* ==================== TAB 2 BODY: PURCHASE ORDERS ==================== */}
                    {activeTab === 'purchase-orders' && (
                        <table className={styles.dataTable}>
                            <thead>
                                <tr>
                                    <th>Mã Phiếu</th>
                                    <th>Nhà cung cấp</th>
                                    <th>Số đầu sách</th>
                                    <th>Tổng giá trị nhập</th>
                                    <th>Trạng thái</th>
                                    <th>Thông tin khởi tạo / Duyệt</th>
                                    <th>Thao tác nghiệp vụ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {purchaseOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className={styles.emptyState}>
                                            Chưa có phiếu nhập kho nào. Hãy bấm "+ Lập Phiếu nhập kho mới" để tạo phiếu!
                                        </td>
                                    </tr>
                                ) : (
                                    purchaseOrders.map((po) => (
                                        <tr key={po.id}>
                                            <td>
                                                <span className={styles.codeChip}>{po.code}</span>
                                            </td>
                                            <td>
                                                <div className={styles.cellTitle}>
                                                    <strong>{po.supplierName}</strong>
                                                    <span>{po.notes || 'Không có ghi chú'}</span>
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 700 }}>{po.items.length} đầu sách</td>
                                            <td style={{ fontWeight: 800, color: '#0d226b' }}>
                                                {po.totalAmount.toLocaleString('vi-VN')} đ
                                            </td>
                                            <td>
                                                <span
                                                    className={`${styles.statusBadge} ${
                                                        po.status === 'Approved'
                                                            ? styles.badgeSuccess
                                                            : po.status === 'Cancelled'
                                                              ? styles.badgeDanger
                                                              : styles.badgeWarning
                                                    }`}
                                                >
                                                    {po.status === 'Approved'
                                                        ? 'Đã duyệt nhập kho'
                                                        : po.status === 'Cancelled'
                                                          ? 'Đã hủy'
                                                          : po.status === 'Draft'
                                                            ? 'Bản nháp'
                                                            : 'Chờ duyệt'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className={styles.cellTitle}>
                                                    <strong>
                                                        {new Date(po.createdAt).toLocaleString('vi-VN')}
                                                    </strong>
                                                    <span>
                                                        {po.approvedBy
                                                            ? `Duyệt bởi: ${po.approvedBy}`
                                                            : po.cancelReason
                                                              ? `Lý do hủy: ${po.cancelReason}`
                                                              : 'Chưa duyệt'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className={styles.actionBtns}>
                                                    <button
                                                        type="button"
                                                        className={styles.btnTable}
                                                        onClick={() => openInspectPoModal(po)}
                                                    >
                                                        <Eye size={13} /> Chi tiết & Kiểm nhận
                                                    </button>
                                                    {po.status !== 'Approved' && po.status !== 'Cancelled' && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                className={`${styles.btnTable} ${styles.success}`}
                                                                onClick={() => openInspectPoModal(po)}
                                                            >
                                                                <CheckCircle2 size={13} /> Duyệt nhập kho
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className={`${styles.btnTable} ${styles.danger}`}
                                                                onClick={() => {
                                                                    setCancellingPo(po);
                                                                    setCancelReasonText('');
                                                                }}
                                                            >
                                                                <XCircle size={13} /> Hủy phiếu
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}

                    {/* ==================== TAB 3 BODY: INVENTORY ALERTS & MOVEMENTS ==================== */}
                    {activeTab === 'alerts' && (
                        <div>
                            <div className={styles.sectionDivider}>
                                <h3>
                                    <AlertTriangle size={16} /> Danh sách Cảnh báo Sách sắp hết hàng chưa xử lý (
                                    {alerts.length})
                                </h3>
                            </div>
                            <table className={styles.dataTable}>
                                <thead>
                                    <tr>
                                        <th>Mã cảnh báo</th>
                                        <th>Đầu sách & ISBN</th>
                                        <th>Tồn kho hiện tại</th>
                                        <th>Ngưỡng tối thiểu</th>
                                        <th>Mức độ cảnh báo</th>
                                        <th>Thời gian phát hiện</th>
                                        <th>Hành động xử lý</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {alerts.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className={styles.emptyState}>
                                                Hiện không có cảnh báo tồn kho nào chưa xử lý. Bạn có thể bấm "Cấu hình
                                                ngưỡng tồn tối thiểu" hoặc "Quét tồn kho" để kiểm tra!
                                            </td>
                                        </tr>
                                    ) : (
                                        alerts.map((a) => (
                                            <tr key={a.id}>
                                                <td>
                                                    <span className={styles.codeChip}>ALT-{a.id}</span>
                                                </td>
                                                <td>
                                                    <div className={styles.cellTitle}>
                                                        <strong>{a.bookTitle || `Sách #${a.bookId}`}</strong>
                                                        <span>ISBN: {a.isbn}</span>
                                                    </div>
                                                </td>
                                                <td style={{ fontWeight: 800, color: '#dc2626', fontSize: 15 }}>
                                                    {a.currentStock} cuốn
                                                </td>
                                                <td style={{ fontWeight: 700 }}>{a.minThreshold} cuốn</td>
                                                <td>
                                                    <span
                                                        className={`${styles.statusBadge} ${
                                                            a.status === 'OutOfStock'
                                                                ? styles.badgeDanger
                                                                : styles.badgeWarning
                                                        }`}
                                                    >
                                                        {a.status === 'OutOfStock'
                                                            ? 'Hết hàng (OutOfStock)'
                                                            : 'Sắp hết hàng (LowStock)'}
                                                    </span>
                                                </td>
                                                <td>{new Date(a.createdAt).toLocaleString('vi-VN')}</td>
                                                <td>
                                                    <div className={styles.actionBtns}>
                                                        <button
                                                            type="button"
                                                            className={styles.btnTable}
                                                            onClick={() => openCreatePoModal(a.bookId)}
                                                        >
                                                            <Plus size={13} /> Lập phiếu nhập bổ sung
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={`${styles.btnTable} ${styles.success}`}
                                                            onClick={() => handleResolveAlert(a.id)}
                                                        >
                                                            <CheckCircle2 size={13} /> Đánh dấu đã xử lý
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>

                            <div className={styles.sectionDivider}>
                                <h3>
                                    <SlidersHorizontal size={16} /> Bảng Tồn kho & Ngưỡng cảnh báo tối thiểu của từng
                                    đầu sách ({books.length} đầu sách)
                                </h3>
                            </div>
                            <table className={styles.dataTable}>
                                <thead>
                                    <tr>
                                        <th>Mã sách</th>
                                        <th>Tên đầu sách & ISBN</th>
                                        <th>Tồn kho thực tế</th>
                                        <th>Ngưỡng tối thiểu</th>
                                        <th>Tình trạng tồn kho</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {books.map((b) => {
                                        const level = b.reorderLevel ?? 5;
                                        const isLow = b.stockCount <= level;
                                        return (
                                            <tr key={b.id}>
                                                <td>
                                                    <span className={styles.codeChip}>#{b.id}</span>
                                                </td>
                                                <td>
                                                    <div className={styles.cellTitle}>
                                                        <strong>{b.title}</strong>
                                                        <span>ISBN: {b.isbn}</span>
                                                    </div>
                                                </td>
                                                <td
                                                    style={{
                                                        fontWeight: 800,
                                                        color: isLow ? '#dc2626' : '#0d226b',
                                                    }}
                                                >
                                                    {b.stockCount} cuốn
                                                </td>
                                                <td style={{ fontWeight: 700 }}>{level} cuốn</td>
                                                <td>
                                                    <span
                                                        className={`${styles.statusBadge} ${
                                                            b.stockCount <= 0
                                                                ? styles.badgeDanger
                                                                : isLow
                                                                  ? styles.badgeWarning
                                                                  : styles.badgeSuccess
                                                        }`}
                                                    >
                                                        {b.stockCount <= 0
                                                            ? 'Hết hàng'
                                                            : isLow
                                                              ? 'Chạm ngưỡng cảnh báo'
                                                              : 'An toàn'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className={styles.btnTable}
                                                        onClick={() => {
                                                            setThresholdBookId(b.id);
                                                            setThresholdValue(level);
                                                            setIsThresholdModalOpen(true);
                                                        }}
                                                    >
                                                        <Edit3 size={13} /> Đổi ngưỡng cảnh báo
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            <div className={styles.sectionDivider}>
                                <h3>
                                    <History size={16} /> Lịch sử Biến động Kho (Tồn trước • Biến động • Tồn sau) (
                                    {movements.length})
                                </h3>
                            </div>
                            <table className={styles.dataTable}>
                                <thead>
                                    <tr>
                                        <th>Thời gian ghi nhận</th>
                                        <th>Đầu sách</th>
                                        <th>Loại giao dịch</th>
                                        <th>Tồn trước</th>
                                        <th>Số lượng thay đổi</th>
                                        <th>Tồn sau</th>
                                        <th>Chứng từ / Lý do</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {movements.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className={styles.emptyState}>
                                                Chưa có lịch sử biến động kho. Khi bạn duyệt Phiếu nhập kho, lịch sử sẽ
                                                tự động ghi vết tại đây!
                                            </td>
                                        </tr>
                                    ) : (
                                        movements.map((m) => (
                                            <tr key={m.id}>
                                                <td>{new Date(m.createdAt).toLocaleString('vi-VN')}</td>
                                                <td>
                                                    <div className={styles.cellTitle}>
                                                        <strong>{m.bookTitle || `Sách #${m.bookId}`}</strong>
                                                        <span>ISBN: {m.isbn}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`${styles.statusBadge} ${styles.badgeInfo}`}>
                                                        {m.movementType}
                                                    </span>
                                                </td>
                                                <td style={{ fontWeight: 600 }}>{m.stockBefore}</td>
                                                <td
                                                    style={{
                                                        fontWeight: 800,
                                                        color: m.quantityChange >= 0 ? '#15803d' : '#dc2626',
                                                    }}
                                                >
                                                    {m.quantityChange >= 0
                                                        ? `+${m.quantityChange}`
                                                        : m.quantityChange}
                                                </td>
                                                <td style={{ fontWeight: 800, color: '#0d226b' }}>
                                                    {m.stockAfter}
                                                </td>
                                                <td>{m.reason}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* ==================== TAB 4 BODY: SHIPPERS & DISPATCH ==================== */}
                    {activeTab === 'shippers' && (
                        <div>
                            <table className={styles.dataTable}>
                                <thead>
                                    <tr>
                                        <th>Mã Shipper</th>
                                        <th>Họ và tên Shipper</th>
                                        <th>Số điện thoại</th>
                                        <th>Khu vực hoạt động</th>
                                        <th>Tải đơn hiện tại</th>
                                        <th>Trạng thái ca</th>
                                        <th>Thao tác điều phối</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shippers.map((s) => {
                                        const ratio = Math.min(
                                            100,
                                            Math.round((s.activeOrdersCount / Math.max(1, s.maxConcurrentOrders)) * 100)
                                        );
                                        const isFull = s.activeOrdersCount >= s.maxConcurrentOrders;
                                        return (
                                            <tr key={s.id}>
                                                <td>
                                                    <span className={styles.codeChip}>SHP-{s.id}</span>
                                                </td>
                                                <td style={{ fontWeight: 700 }}>{s.name}</td>
                                                <td>{s.phone}</td>
                                                <td>{s.area}</td>
                                                <td>
                                                    <div className={styles.workloadWrap}>
                                                        <div className={styles.workloadText}>
                                                            <span>
                                                                {s.activeOrdersCount} / {s.maxConcurrentOrders} đơn
                                                            </span>
                                                            <span
                                                                style={{
                                                                    color: isFull ? '#dc2626' : '#15803d',
                                                                }}
                                                            >
                                                                {isFull ? 'Đầy tải' : 'Còn nhận đơn'}
                                                            </span>
                                                        </div>
                                                        <div className={styles.workloadBar}>
                                                            <div
                                                                className={`${styles.workloadFill} ${
                                                                    isFull ? styles.full : ''
                                                                }`}
                                                                style={{ width: `${ratio}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <select
                                                        className={styles.filterSelect}
                                                        value={s.status}
                                                        onChange={(e) =>
                                                            handleChangeShipperStatus(s.id, e.target.value)
                                                        }
                                                    >
                                                        <option value="Active">Active (Sẵn sàng)</option>
                                                        <option value="Busy">Busy (Đang bận)</option>
                                                        <option value="Off">Off (Nghỉ ca)</option>
                                                    </select>
                                                </td>
                                                <td>
                                                    <div className={styles.actionBtns}>
                                                        <button
                                                            type="button"
                                                            className={styles.btnTable}
                                                            onClick={() => handleViewShipperOrders(s)}
                                                        >
                                                            <Eye size={13} /> Xem đơn đang giao
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={styles.btnTable}
                                                            onClick={() => openEditShipperModal(s)}
                                                        >
                                                            <Edit3 size={13} /> Sửa
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {selectedShipperOrders && (
                                <div>
                                    <div className={styles.sectionDivider}>
                                        <h3>
                                            <Truck size={16} /> Danh sách Vận đơn được phân công cho Shipper:{' '}
                                            {selectedShipperOrders.shipper.name} ({selectedShipperOrders.orders.length}{' '}
                                            đơn)
                                        </h3>
                                        <button
                                            type="button"
                                            className={styles.btnSecondary}
                                            onClick={() => setSelectedShipperOrders(null)}
                                        >
                                            Đóng danh sách
                                        </button>
                                    </div>
                                    <table className={styles.dataTable}>
                                        <thead>
                                            <tr>
                                                <th>Mã vận đơn</th>
                                                <th>Khách hàng</th>
                                                <th>Địa chỉ giao / thu hồi</th>
                                                <th>Tổng tiền</th>
                                                <th>Trạng thái đơn</th>
                                                <th>Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedShipperOrders.orders.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className={styles.emptyState}>
                                                        Shipper này hiện chưa có vận đơn nào được phân công.
                                                    </td>
                                                </tr>
                                            ) : (
                                                selectedShipperOrders.orders.map((o) => (
                                                    <tr key={o.orderId}>
                                                        <td>
                                                            <span className={styles.codeChip}>
                                                                {o.orderCode}
                                                            </span>
                                                        </td>
                                                        <td style={{ fontWeight: 700 }}>{o.customerName}</td>
                                                        <td>{o.shippingAddress}</td>
                                                        <td style={{ fontWeight: 700 }}>
                                                            {o.finalAmount.toLocaleString('vi-VN')} đ
                                                        </td>
                                                        <td>
                                                            <span
                                                                className={`${styles.statusBadge} ${styles.badgeInfo}`}
                                                            >
                                                                {o.status}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <button
                                                                type="button"
                                                                className={`${styles.btnTable} ${styles.danger}`}
                                                                onClick={() =>
                                                                    handleUnassignOrder(o.orderId)
                                                                }
                                                            >
                                                                <XCircle size={13} /> Thu hồi / Hủy gán
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </div>

            {/* ==================== MODAL 1: ADD / EDIT SUPPLIER ==================== */}
            {isSupplierModalOpen && (
                <div className={styles.overlay}>
                    <form className={styles.modal} onSubmit={handleSaveSupplier}>
                        <div className={styles.modalHeader}>
                            <div>
                                <h3>
                                    {editingSupplierId
                                        ? `Cập nhật Nhà cung cấp #${editingSupplierId}`
                                        : 'Thêm Nhà cung cấp mới'}
                                </h3>
                                <p>Quản lý thông tin đối tác cung ứng sách, mã số thuế và trạng thái hợp tác</p>
                            </div>
                            <button
                                type="button"
                                className={styles.modalClose}
                                onClick={() => setIsSupplierModalOpen(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Tên Nhà cung cấp *</label>
                                    <input
                                        className={styles.formControl}
                                        required
                                        value={supplierForm.name}
                                        onChange={(e) =>
                                            setSupplierForm({ ...supplierForm, name: e.target.value })
                                        }
                                        placeholder="VD: Công ty CP Phát hành Sách FAHASA"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Mã số thuế *</label>
                                    <input
                                        className={styles.formControl}
                                        required
                                        value={supplierForm.taxCode}
                                        onChange={(e) =>
                                            setSupplierForm({ ...supplierForm, taxCode: e.target.value })
                                        }
                                        placeholder="VD: 0304132047"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Người đại diện liên hệ</label>
                                    <input
                                        className={styles.formControl}
                                        value={supplierForm.contactPerson}
                                        onChange={(e) =>
                                            setSupplierForm({
                                                ...supplierForm,
                                                contactPerson: e.target.value,
                                            })
                                        }
                                        placeholder="VD: Nguyễn Văn Hòa"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Số điện thoại</label>
                                    <input
                                        className={styles.formControl}
                                        value={supplierForm.phone}
                                        onChange={(e) =>
                                            setSupplierForm({ ...supplierForm, phone: e.target.value })
                                        }
                                        placeholder="VD: 02838225796"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Email liên hệ</label>
                                    <input
                                        type="email"
                                        className={styles.formControl}
                                        value={supplierForm.email}
                                        onChange={(e) =>
                                            setSupplierForm({ ...supplierForm, email: e.target.value })
                                        }
                                        placeholder="VD: contact@fahasa.com.vn"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Trạng thái hợp tác</label>
                                    <select
                                        className={styles.formControl}
                                        value={supplierForm.status}
                                        onChange={(e) =>
                                            setSupplierForm({ ...supplierForm, status: e.target.value })
                                        }
                                    >
                                        <option value="Active">Đang hợp tác (Active)</option>
                                        <option value="Inactive">Ngừng hợp tác (Inactive)</option>
                                    </select>
                                </div>
                                <div className={styles.formGroupFull}>
                                    <label className={styles.formLabel}>Địa chỉ trụ sở</label>
                                    <input
                                        className={styles.formControl}
                                        value={supplierForm.address}
                                        onChange={(e) =>
                                            setSupplierForm({ ...supplierForm, address: e.target.value })
                                        }
                                        placeholder="VD: 60-62 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button
                                type="button"
                                className={styles.btnSecondary}
                                onClick={() => setIsSupplierModalOpen(false)}
                            >
                                Hủy bỏ
                            </button>
                            <button type="submit" className={styles.btnPrimary}>
                                {editingSupplierId ? 'Lưu cập nhật' : 'Tạo Nhà cung cấp'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ==================== MODAL 2: CREATE PURCHASE ORDER ==================== */}
            {isCreatePoModalOpen && (
                <div className={styles.overlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <div>
                                <h3>Lập Phiếu nhập kho từ Nhà cung cấp</h3>
                                <p>Hệ thống tự động sinh mã phiếu theo định dạng chuẩn PO-YYYY-XXX</p>
                            </div>
                            <button
                                type="button"
                                className={styles.modalClose}
                                onClick={() => setIsCreatePoModalOpen(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Chọn Nhà cung cấp (Đang hợp tác)</label>
                                    <select
                                        className={styles.formControl}
                                        value={poFormSupplierId}
                                        onChange={(e) => setPoFormSupplierId(Number(e.target.value))}
                                    >
                                        {suppliers.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                #{s.id} - {s.name} ({s.status})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Ghi chú chứng từ nhập kho</label>
                                    <input
                                        className={styles.formControl}
                                        value={poFormNotes}
                                        onChange={(e) => setPoFormNotes(e.target.value)}
                                        placeholder="VD: Nhập bổ sung đợt 1 tháng 11..."
                                    />
                                </div>
                            </div>

                            <div className={styles.formGroupFull}>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <label className={styles.formLabel}>
                                        Danh sách đầu sách đặt nhập ({poFormItems.length} dòng)
                                    </label>
                                    <button
                                        type="button"
                                        className={styles.btnTable}
                                        onClick={() =>
                                            setPoFormItems([
                                                ...poFormItems,
                                                {
                                                    bookId: books[0]?.id ?? 1,
                                                    orderedQuantity: 10,
                                                    unitPrice: books[0]?.physicalPrice ?? 85000,
                                                },
                                            ])
                                        }
                                    >
                                        <Plus size={12} /> Thêm dòng sách
                                    </button>
                                </div>

                                {poFormItems.map((item, idx) => (
                                    <div key={idx} className={styles.poItemRow}>
                                        <select
                                            className={styles.formControl}
                                            value={item.bookId}
                                            onChange={(e) => {
                                                const bookId = Number(e.target.value);
                                                const found = books.find((b) => b.id === bookId);
                                                const next = [...poFormItems];
                                                next[idx] = {
                                                    ...next[idx],
                                                    bookId,
                                                    unitPrice: found
                                                        ? found.physicalPrice
                                                        : next[idx].unitPrice,
                                                };
                                                setPoFormItems(next);
                                            }}
                                        >
                                            {books.map((b) => (
                                                <option key={b.id} value={b.id}>
                                                    #{b.id} - {b.title} (Tồn: {b.stockCount})
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="number"
                                            min={1}
                                            className={styles.formControl}
                                            value={item.orderedQuantity}
                                            onChange={(e) => {
                                                const next = [...poFormItems];
                                                next[idx].orderedQuantity = Number(e.target.value);
                                                setPoFormItems(next);
                                            }}
                                            placeholder="SL đặt"
                                        />
                                        <input
                                            type="number"
                                            min={0}
                                            className={styles.formControl}
                                            value={item.unitPrice}
                                            onChange={(e) => {
                                                const next = [...poFormItems];
                                                next[idx].unitPrice = Number(e.target.value);
                                                setPoFormItems(next);
                                            }}
                                            placeholder="Đơn giá nhập"
                                        />
                                        {poFormItems.length > 1 && (
                                            <button
                                                type="button"
                                                className={`${styles.btnTable} ${styles.danger}`}
                                                onClick={() =>
                                                    setPoFormItems(poFormItems.filter((_, i) => i !== idx))
                                                }
                                            >
                                                <X size={13} />
                                            </button>
                                        )}
                                    </div>
                                ))}

                                <div
                                    style={{
                                        textAlign: 'right',
                                        marginTop: 8,
                                        fontWeight: 800,
                                        color: '#0d226b',
                                    }}
                                >
                                    Tổng giá trị dự kiến:{' '}
                                    {poFormItems
                                        .reduce((sum, i) => sum + i.orderedQuantity * i.unitPrice, 0)
                                        .toLocaleString('vi-VN')}{' '}
                                    đ
                                </div>
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button
                                type="button"
                                className={styles.btnSecondary}
                                onClick={() => setIsCreatePoModalOpen(false)}
                            >
                                Đóng
                            </button>
                            <button
                                type="button"
                                className={styles.btnSecondary}
                                onClick={() => handleCreatePurchaseOrder(true)}
                            >
                                Lưu bản nháp (Draft)
                            </button>
                            <button
                                type="button"
                                className={styles.btnPrimary}
                                onClick={() => handleCreatePurchaseOrder(false)}
                            >
                                Gửi duyệt Phiếu nhập (Pending)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== MODAL 3: INSPECT & APPROVE PO ==================== */}
            {inspectingPo && (
                <div className={styles.overlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <div>
                                <h3>
                                    Phiếu nhập kho {inspectingPo.code} — {inspectingPo.supplierName}
                                </h3>
                                <p>
                                    Kiểm nhận số lượng thực tế về kho và duyệt cộng tồn kho an toàn trong 1 Transaction
                                </p>
                            </div>
                            <button
                                type="button"
                                className={styles.modalClose}
                                onClick={() => setInspectingPo(null)}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <table className={styles.dataTable}>
                                <thead>
                                    <tr>
                                        <th>Đầu sách</th>
                                        <th>SL Đặt</th>
                                        <th>SL Thực nhận về kho</th>
                                        <th>Đơn giá nhập</th>
                                        <th>Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inspectingPo.items.map((item) => {
                                        const canEdit =
                                            inspectingPo.status !== 'Approved' &&
                                            inspectingPo.status !== 'Cancelled';
                                        const currentQty =
                                            receivedQtyMap[item.bookId] !== undefined
                                                ? receivedQtyMap[item.bookId]
                                                : item.orderedQuantity;
                                        return (
                                            <tr key={item.id}>
                                                <td>
                                                    <div className={styles.cellTitle}>
                                                        <strong>
                                                            {item.bookTitle || `Sách #${item.bookId}`}
                                                        </strong>
                                                        <span>ISBN: {item.isbn}</span>
                                                    </div>
                                                </td>
                                                <td style={{ fontWeight: 700 }}>{item.orderedQuantity}</td>
                                                <td>
                                                    {canEdit ? (
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            className={styles.formControl}
                                                            style={{ width: 95 }}
                                                            value={currentQty}
                                                            onChange={(e) =>
                                                                setReceivedQtyMap({
                                                                    ...receivedQtyMap,
                                                                    [item.bookId]: Number(e.target.value),
                                                                })
                                                            }
                                                        />
                                                    ) : (
                                                        <strong>{item.receivedQuantity}</strong>
                                                    )}
                                                </td>
                                                <td>{item.unitPrice.toLocaleString('vi-VN')} đ</td>
                                                <td style={{ fontWeight: 700, color: '#0d226b' }}>
                                                    {(currentQty * item.unitPrice).toLocaleString('vi-VN')} đ
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {inspectingPo.status !== 'Approved' && inspectingPo.status !== 'Cancelled' && (
                                <div className={styles.formGroupFull}>
                                    <label className={styles.formLabel}>Ghi chú kiểm nhận khi duyệt kho</label>
                                    <input
                                        className={styles.formControl}
                                        value={approveNotes}
                                        onChange={(e) => setApproveNotes(e.target.value)}
                                        placeholder="VD: Đã kiểm đếm đủ số lượng và chất lượng sách..."
                                    />
                                </div>
                            )}
                        </div>
                        <div className={styles.modalFooter}>
                            <button
                                type="button"
                                className={styles.btnSecondary}
                                onClick={() => setInspectingPo(null)}
                            >
                                Đóng
                            </button>
                            {inspectingPo.status !== 'Approved' && inspectingPo.status !== 'Cancelled' && (
                                <button
                                    type="button"
                                    className={styles.btnSuccess}
                                    onClick={handleApprovePurchaseOrder}
                                >
                                    <CheckCircle2 size={16} /> Xác nhận Duyệt & Cộng tồn kho
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== MODAL 4: CANCEL PO ==================== */}
            {cancellingPo && (
                <div className={styles.overlay}>
                    <form
                        className={`${styles.modal} ${styles.modalSmall}`}
                        onSubmit={handleConfirmCancelPo}
                    >
                        <div className={styles.modalHeader}>
                            <div>
                                <h3>Hủy Phiếu nhập kho {cancellingPo.code}</h3>
                                <p>Vui lòng nhập lý do hủy phiếu để lưu vết chứng từ</p>
                            </div>
                            <button
                                type="button"
                                className={styles.modalClose}
                                onClick={() => setCancellingPo(null)}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.formGroupFull}>
                                <label className={styles.formLabel}>Lý do hủy phiếu *</label>
                                <input
                                    className={styles.formControl}
                                    required
                                    value={cancelReasonText}
                                    onChange={(e) => setCancelReasonText(e.target.value)}
                                    placeholder="VD: Nhà cung cấp báo hết ấn bản..."
                                />
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button
                                type="button"
                                className={styles.btnSecondary}
                                onClick={() => setCancellingPo(null)}
                            >
                                Quay lại
                            </button>
                            <button type="submit" className={styles.btnDanger}>
                                Xác nhận Hủy phiếu
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ==================== MODAL 5: UPDATE REORDER THRESHOLD ==================== */}
            {isThresholdModalOpen && (
                <div className={styles.overlay}>
                    <form
                        className={`${styles.modal} ${styles.modalSmall}`}
                        onSubmit={handleUpdateThreshold}
                    >
                        <div className={styles.modalHeader}>
                            <div>
                                <h3>Cấu hình Ngưỡng tồn kho tối thiểu</h3>
                                <p>Khi số lượng tồn kho chạm hoặc thấp hơn ngưỡng này, hệ thống sẽ tự động phát cảnh báo</p>
                            </div>
                            <button
                                type="button"
                                className={styles.modalClose}
                                onClick={() => setIsThresholdModalOpen(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.formGroupFull}>
                                <label className={styles.formLabel}>Chọn đầu sách</label>
                                <select
                                    className={styles.formControl}
                                    value={thresholdBookId}
                                    onChange={(e) => setThresholdBookId(Number(e.target.value))}
                                >
                                    {books.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            #{b.id} - {b.title} (Tồn hiện tại: {b.stockCount} cuốn)
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.formGroupFull}>
                                <label className={styles.formLabel}>Ngưỡng tồn kho tối thiểu mới *</label>
                                <input
                                    type="number"
                                    min={0}
                                    required
                                    className={styles.formControl}
                                    value={thresholdValue}
                                    onChange={(e) => setThresholdValue(Number(e.target.value))}
                                />
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button
                                type="button"
                                className={styles.btnSecondary}
                                onClick={() => setIsThresholdModalOpen(false)}
                            >
                                Hủy
                            </button>
                            <button type="submit" className={styles.btnPrimary}>
                                Lưu & Quét lại cảnh báo
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ==================== MODAL 6: ADD / EDIT SHIPPER ==================== */}
            {isShipperModalOpen && (
                <div className={styles.overlay}>
                    <form
                        className={`${styles.modal} ${styles.modalSmall}`}
                        onSubmit={handleSaveShipper}
                    >
                        <div className={styles.modalHeader}>
                            <div>
                                <h3>
                                    {editingShipperId
                                        ? `Cập nhật thông tin Shipper #${editingShipperId}`
                                        : 'Thêm Shipper mới'}
                                </h3>
                                <p>Thiết lập khu vực giao hàng và giới hạn số đơn nhận đồng thời</p>
                            </div>
                            <button
                                type="button"
                                className={styles.modalClose}
                                onClick={() => setIsShipperModalOpen(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Họ và tên Shipper *</label>
                                    <input
                                        className={styles.formControl}
                                        required
                                        value={shipperForm.name}
                                        onChange={(e) =>
                                            setShipperForm({ ...shipperForm, name: e.target.value })
                                        }
                                        placeholder="VD: Ngô Bá Duy"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Số điện thoại *</label>
                                    <input
                                        className={styles.formControl}
                                        required
                                        value={shipperForm.phone}
                                        onChange={(e) =>
                                            setShipperForm({ ...shipperForm, phone: e.target.value })
                                        }
                                        placeholder="VD: 0903000001"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Trạng thái ca làm việc</label>
                                    <select
                                        className={styles.formControl}
                                        value={shipperForm.status}
                                        onChange={(e) =>
                                            setShipperForm({ ...shipperForm, status: e.target.value })
                                        }
                                    >
                                        <option value="Active">Active (Sẵn sàng)</option>
                                        <option value="Busy">Busy (Đang bận)</option>
                                        <option value="Off">Off (Nghỉ ca)</option>
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Giới hạn đơn nhận cùng lúc</label>
                                    <input
                                        type="number"
                                        min={1}
                                        className={styles.formControl}
                                        value={shipperForm.maxConcurrentOrders}
                                        onChange={(e) =>
                                            setShipperForm({
                                                ...shipperForm,
                                                maxConcurrentOrders: Number(e.target.value),
                                            })
                                        }
                                    />
                                </div>
                                <div className={styles.formGroupFull}>
                                    <label className={styles.formLabel}>Khu vực phụ trách</label>
                                    <input
                                        className={styles.formControl}
                                        value={shipperForm.area}
                                        onChange={(e) =>
                                            setShipperForm({ ...shipperForm, area: e.target.value })
                                        }
                                        placeholder="VD: Quận 1, Quận 3, TP.HCM"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button
                                type="button"
                                className={styles.btnSecondary}
                                onClick={() => setIsShipperModalOpen(false)}
                            >
                                Hủy
                            </button>
                            <button type="submit" className={styles.btnPrimary}>
                                Lưu thông tin Shipper
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ==================== MODAL 7: ASSIGN ORDER TO SHIPPER ==================== */}
            {isAssignModalOpen && (
                <div className={styles.overlay}>
                    <form
                        className={`${styles.modal} ${styles.modalSmall}`}
                        onSubmit={handleAssignShipper}
                    >
                        <div className={styles.modalHeader}>
                            <div>
                                <h3>Điều phối & Phân công Vận đơn cho Shipper</h3>
                                <p>Hệ thống tự động kiểm tra trạng thái hoạt động và giới hạn số đơn nhận</p>
                            </div>
                            <button
                                type="button"
                                className={styles.modalClose}
                                onClick={() => setIsAssignModalOpen(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.formGroupFull}>
                                <label className={styles.formLabel}>Chọn Vận đơn vật lý cần giao / thu hồi</label>
                                <select
                                    className={styles.formControl}
                                    value={assignOrderId}
                                    onChange={(e) => setAssignOrderId(Number(e.target.value))}
                                >
                                    {physicalOrders.map((o) => (
                                        <option key={o.orderId} value={o.orderId}>
                                            {o.orderCode} - {o.customerName} ({o.status}) • Địa chỉ:{' '}
                                            {o.shippingAddress}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.formGroupFull}>
                                <label className={styles.formLabel}>Chọn Shipper phụ trách</label>
                                <select
                                    className={styles.formControl}
                                    value={assignShipperId}
                                    onChange={(e) => setAssignShipperId(Number(e.target.value))}
                                >
                                    {shippers.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} ({s.area}) — Tải: {s.activeOrdersCount}/
                                            {s.maxConcurrentOrders} đơn [{s.status}]
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button
                                type="button"
                                className={styles.btnSecondary}
                                onClick={() => setIsAssignModalOpen(false)}
                            >
                                Hủy
                            </button>
                            <button type="submit" className={styles.btnSuccess}>
                                <Truck size={15} /> Xác nhận Phân công
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </AdminLayout>
    );
};

export default WarehouseLogisticsPage;

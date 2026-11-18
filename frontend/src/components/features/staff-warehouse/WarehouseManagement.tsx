import React from 'react';
import {
    Building2,
    FileSpreadsheet,
    AlertTriangle,
    History,
    CheckCircle2,
    XCircle,
} from 'lucide-react';
import { useWarehouseManagement } from '../../../hooks/useWarehouseManagement';
import { SupplierSection, SupplierToolbar } from './SupplierSection';
import { PurchaseOrderSection, PurchaseOrderToolbar } from './PurchaseOrderSection';
import { StockAlertMovementSection, StockAlertToolbar } from './StockAlertMovementSection';
import styles from '../../../pages/WarehouseLogisticsPage.module.css';

export const WarehouseManagement: React.FC = () => {
    const controller = useWarehouseManagement();
    const { activeTab, setActiveTab, toast, suppliers, purchaseOrders, alerts, movements } = controller;

    const activeSuppliersCount = suppliers.filter((s) => s.status === 'Active').length;
    const pendingPoCount = purchaseOrders.filter(
        (po) => po.status === 'Pending' || po.status === 'Draft'
    ).length;

    return (
        <>
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

                        {activeTab === 'suppliers' && <SupplierToolbar {...controller} />}
                        {activeTab === 'purchase-orders' && <PurchaseOrderToolbar {...controller} />}
                        {activeTab === 'alerts' && <StockAlertToolbar {...controller} />}
                    </div>

                    {activeTab === 'suppliers' && <SupplierSection {...controller} />}
                    {activeTab === 'purchase-orders' && <PurchaseOrderSection {...controller} />}
                    {activeTab === 'alerts' && <StockAlertMovementSection {...controller} />}
                </section>
            </div>
        </>
    );
};

export default WarehouseManagement;

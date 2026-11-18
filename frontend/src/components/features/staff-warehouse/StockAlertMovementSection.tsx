import React from 'react';
import {
    AlertTriangle,
    ShieldAlert,
    SlidersHorizontal,
    History,
    Plus,
    CheckCircle2,
    Edit3,
    X,
} from 'lucide-react';
import type {
    StockAlertDto,
    StockMovementDto,
    SimpleBookOption,
} from '../../../types/warehouse';
import styles from '../../../pages/WarehouseLogisticsPage.module.css';

interface StockAlertMovementSectionProps {
    alerts: StockAlertDto[];
    books: SimpleBookOption[];
    movements: StockMovementDto[];
    movementTypeFilter: string;
    handleFilterMovements: (typeVal: string) => Promise<void>;
    handleScanAlerts: () => Promise<void>;
    handleResolveAlert: (alertId: number) => Promise<void>;
    openCreatePoModal: (prefillBookId?: number) => void;
    isThresholdModalOpen: boolean;
    setIsThresholdModalOpen: (v: boolean) => void;
    thresholdBookId: number;
    setThresholdBookId: (v: number) => void;
    thresholdValue: number;
    setThresholdValue: (v: number) => void;
    handleUpdateThreshold: (e: React.FormEvent) => Promise<void>;
}

export const StockAlertToolbar: React.FC<
    Pick<
        StockAlertMovementSectionProps,
        | 'handleScanAlerts'
        | 'setIsThresholdModalOpen'
        | 'movementTypeFilter'
        | 'handleFilterMovements'
    >
> = ({ handleScanAlerts, setIsThresholdModalOpen, movementTypeFilter, handleFilterMovements }) => (
    <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
            <button type="button" className={styles.btnPrimary} onClick={() => void handleScanAlerts()}>
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
                onChange={(e) => void handleFilterMovements(e.target.value)}
            >
                <option value="">Tất cả biến động kho</option>
                <option value="Import">Nhập kho (Import)</option>
                <option value="Sale">Xuất bán (Sale)</option>
                <option value="Audit_Adjustment">Cân bằng kiểm kê</option>
            </select>
        </div>
    </div>
);

export const StockAlertMovementSection: React.FC<StockAlertMovementSectionProps> = ({
    alerts,
    books,
    movements,
    handleResolveAlert,
    openCreatePoModal,
    isThresholdModalOpen,
    setIsThresholdModalOpen,
    thresholdBookId,
    setThresholdBookId,
    thresholdValue,
    setThresholdValue,
    handleUpdateThreshold,
}) => {
    return (
        <div>
            <div className={styles.sectionDivider}>
                <h3>
                    <AlertTriangle size={16} /> Danh sách Cảnh báo Sách sắp hết hàng chưa xử lý ({alerts.length})
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
                                Hiện không có cảnh báo tồn kho nào chưa xử lý. Bạn có thể bấm "Cấu hình ngưỡng tồn
                                tối thiểu" hoặc "Quét tồn kho" để kiểm tra!
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
                                            onClick={() => void handleResolveAlert(a.id)}
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
                    <SlidersHorizontal size={16} /> Bảng Tồn kho & Ngưỡng cảnh báo tối thiểu của từng đầu sách (
                    {books.length} đầu sách)
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
                                Chưa có lịch sử biến động kho. Khi bạn duyệt Phiếu nhập kho, lịch sử sẽ tự động ghi
                                vết tại đây!
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
                                    {m.quantityChange >= 0 ? `+${m.quantityChange}` : m.quantityChange}
                                </td>
                                <td style={{ fontWeight: 800, color: '#0d226b' }}>{m.stockAfter}</td>
                                <td>{m.reason}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {isThresholdModalOpen && (
                <div className={styles.overlay}>
                    <form
                        className={`${styles.modal} ${styles.modalSmall}`}
                        onSubmit={(e) => void handleUpdateThreshold(e)}
                    >
                        <div className={styles.modalHeader}>
                            <div>
                                <h3>Cấu hình Ngưỡng tồn kho tối thiểu</h3>
                                <p>
                                    Khi số lượng tồn kho chạm hoặc thấp hơn ngưỡng này, hệ thống sẽ tự động phát
                                    cảnh báo
                                </p>
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
        </div>
    );
};

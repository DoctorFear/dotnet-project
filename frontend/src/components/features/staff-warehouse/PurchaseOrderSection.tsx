import React from 'react';
import { Search, RefreshCw, Plus, Eye, CheckCircle2, XCircle, X } from 'lucide-react';
import type {
    PurchaseOrderDto,
    SupplierDto,
    SimpleBookOption,
} from '../../../types/warehouse';
import styles from '../../../pages/WarehouseLogisticsPage.module.css';

interface PurchaseOrderSectionProps {
    purchaseOrders: PurchaseOrderDto[];
    suppliers: SupplierDto[];
    books: SimpleBookOption[];
    poKeyword: string;
    setPoKeyword: (v: string) => void;
    poStatusFilter: string;
    setPoStatusFilter: (v: string) => void;
    filterPurchaseOrders: () => Promise<void>;
    openCreatePoModal: (prefillBookId?: number) => void;
    openInspectPoModal: (po: PurchaseOrderDto) => void;
    setCancellingPo: (po: PurchaseOrderDto | null) => void;
    setCancelReasonText: (v: string) => void;
    isCreatePoModalOpen: boolean;
    setIsCreatePoModalOpen: (v: boolean) => void;
    poFormSupplierId: number;
    setPoFormSupplierId: (v: number) => void;
    poFormNotes: string;
    setPoFormNotes: (v: string) => void;
    poFormItems: { bookId: number; orderedQuantity: number; unitPrice: number }[];
    setPoFormItems: React.Dispatch<
        React.SetStateAction<{ bookId: number; orderedQuantity: number; unitPrice: number }[]>
    >;
    handleCreatePurchaseOrder: (isDraft: boolean) => Promise<void>;
    inspectingPo: PurchaseOrderDto | null;
    setInspectingPo: (po: PurchaseOrderDto | null) => void;
    receivedQtyMap: Record<number, number>;
    setReceivedQtyMap: React.Dispatch<React.SetStateAction<Record<number, number>>>;
    approveNotes: string;
    setApproveNotes: (v: string) => void;
    handleApprovePurchaseOrder: () => Promise<void>;
    cancellingPo: PurchaseOrderDto | null;
    cancelReasonText: string;
    handleConfirmCancelPo: (e: React.FormEvent) => Promise<void>;
}

export const PurchaseOrderToolbar: React.FC<
    Pick<
        PurchaseOrderSectionProps,
        | 'poKeyword'
        | 'setPoKeyword'
        | 'poStatusFilter'
        | 'setPoStatusFilter'
        | 'filterPurchaseOrders'
        | 'openCreatePoModal'
    >
> = ({
    poKeyword,
    setPoKeyword,
    poStatusFilter,
    setPoStatusFilter,
    filterPurchaseOrders,
    openCreatePoModal,
}) => (
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
            <button type="button" className={styles.btnSecondary} onClick={() => void filterPurchaseOrders()}>
                <RefreshCw size={14} /> Làm mới
            </button>
        </div>
        <div className={styles.toolbarRight}>
            <button type="button" className={styles.btnPrimary} onClick={() => openCreatePoModal()}>
                <Plus size={16} /> Lập Phiếu nhập kho mới
            </button>
        </div>
    </div>
);

export const PurchaseOrderSection: React.FC<PurchaseOrderSectionProps> = ({
    purchaseOrders,
    suppliers,
    books,
    openInspectPoModal,
    setCancellingPo,
    setCancelReasonText,
    isCreatePoModalOpen,
    setIsCreatePoModalOpen,
    poFormSupplierId,
    setPoFormSupplierId,
    poFormNotes,
    setPoFormNotes,
    poFormItems,
    setPoFormItems,
    handleCreatePurchaseOrder,
    inspectingPo,
    setInspectingPo,
    receivedQtyMap,
    setReceivedQtyMap,
    approveNotes,
    setApproveNotes,
    handleApprovePurchaseOrder,
    cancellingPo,
    cancelReasonText,
    handleConfirmCancelPo,
}) => {
    return (
        <>
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
                                        <strong>{new Date(po.createdAt).toLocaleString('vi-VN')}</strong>
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

            {/* Modal Lập Phiếu nhập kho */}
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
                                                    unitPrice: found ? found.physicalPrice : next[idx].unitPrice,
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
                                onClick={() => void handleCreatePurchaseOrder(true)}
                            >
                                Lưu bản nháp (Draft)
                            </button>
                            <button
                                type="button"
                                className={styles.btnPrimary}
                                onClick={() => void handleCreatePurchaseOrder(false)}
                            >
                                Gửi duyệt Phiếu nhập (Pending)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Chi tiết & Duyệt Phiếu nhập */}
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
                                    onClick={() => void handleApprovePurchaseOrder()}
                                >
                                    <CheckCircle2 size={16} /> Xác nhận Duyệt & Cộng tồn kho
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Hủy Phiếu nhập */}
            {cancellingPo && (
                <div className={styles.overlay}>
                    <form
                        className={`${styles.modal} ${styles.modalSmall}`}
                        onSubmit={(e) => void handleConfirmCancelPo(e)}
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
        </>
    );
};

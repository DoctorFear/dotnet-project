import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardCheck, PackageCheck, XCircle } from 'lucide-react';
import type { useFulfillment } from '../../../hooks/useFulfillment';
import type { PackingVerification } from '../../../types/workflow';
import { WorkflowError, WorkflowModal } from '../workflow/WorkflowShared';
import PackingConfirmationDialog from './PackingConfirmationDialog';
import PackingOrderSummary from './PackingOrderSummary';
import PackingScanPanel from './PackingScanPanel';
import PackingWaybill from './PackingWaybill';
import { workflowDateTime } from '../../../utils/workflowPresentation';
import common from '../workflow/Workflow.module.css';
import styles from './Fulfillment.module.css';

interface PackingDetailModalProps {
    packing: ReturnType<typeof useFulfillment>;
    issue: boolean;
    reason: string;
    setIssue: (value: boolean) => void;
    setReason: (value: string) => void;
}

export default function PackingDetailModal({
    packing,
    issue,
    reason,
    setIssue,
    setReason,
}: PackingDetailModalProps) {
    const detail = packing.selected;
    const [scannedCodes, setScannedCodes] = useState<Record<number, string[]>>({});
    const [inspections, setInspections] = useState<Record<number, boolean>>({});
    const [packingNote, setPackingNote] = useState('');
    const [confirmOpen, setConfirmOpen] = useState(false);


    const verification = useMemo<PackingVerification | null>(() => {
        if (!detail) return null;
        return {
            verifiedItems: detail.items.map((item) => ({
                bookId: item.bookId,
                verifiedQuantity: item.quantity,
                scannedCodes: scannedCodes[item.bookId] ?? [],
                visualInspectionPassed: inspections[item.bookId] ?? false,
            })),
            note: packingNote.trim() || undefined,
        };
    }, [detail, inspections, packingNote, scannedCodes]);

    if (!detail && !packing.loadingDetail) return null;

    const close = () => {
        if (packing.busy) return;
        packing.setSelected(null);
        setConfirmOpen(false);
    };

    const canConfirm = Boolean(
        detail?.canConfirmPacking
        && verification
        && verification.verifiedItems.length > 0
        && verification.verifiedItems.every((item) => {
            const expected = detail.items.find((book) => book.bookId === item.bookId)?.quantity ?? 0;
            return item.scannedCodes.length === expected && item.visualInspectionPassed;
        }),
    );

    const verifiedQuantity = verification?.verifiedItems.reduce(
        (sum, item) => sum + item.scannedCodes.length,
        0,
    ) ?? 0;
    const totalQuantity = detail?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
    const prepared = detail?.status === 3;
    const orderCode = detail?.orderCode
        || (detail ? `ORD-${String(detail.orderId).padStart(8, '0')}` : 'Đang tải...');

    return (
        <WorkflowModal
            title={`${prepared ? 'Kết quả đóng gói' : 'Soạn sách & đóng gói'} · ${orderCode}`}
            onClose={close}
            busy={packing.busy}
            sheet
        >
            <div className={common.dialogBody}>
                {packing.loadingDetail || !detail ? (
                    <div className={common.loading}>Đang tải dữ liệu đơn hàng...</div>
                ) : (
                    <>
                        <PackingOrderSummary detail={detail} />

                        {detail.packingIssue && (
                            <div className={styles.alert}>
                                <AlertTriangle size={16} />
                                <span><b>Sự cố kho đã ghi nhận:</b> {detail.packingIssue}</span>
                            </div>
                        )}

                        {!prepared && detail.canConfirmPacking !== false && (
                            <>
                                <div className={styles.sectionTitle}>
                                    <div>
                                        <ClipboardCheck size={16} />
                                        <span>
                                            <strong>Danh sách lấy hàng & xác minh từng cuốn</strong>
                                            <small>Đến đúng kệ, lấy đủ số lượng, quét mã rồi kiểm tra ngoại quan.</small>
                                        </span>
                                    </div>
                                    <b>{verifiedQuantity}/{totalQuantity} đã quét</b>
                                </div>

                                <div className={styles.itemList}>
                                    {detail.items.map((item) => (
                                        <PackingScanPanel
                                            key={item.bookId}
                                            item={item}
                                            scannedCodes={scannedCodes[item.bookId] ?? []}
                                            visualInspectionPassed={inspections[item.bookId] ?? false}
                                            disabled={packing.busy}
                                            onScannedCodesChange={(codes) => setScannedCodes((current) => ({
                                                ...current,
                                                [item.bookId]: codes,
                                            }))}
                                            onVisualInspectionChange={(passed) => setInspections((current) => ({
                                                ...current,
                                                [item.bookId]: passed,
                                            }))}
                                        />
                                    ))}
                                </div>

                                <div className={`${styles.verificationStatus} ${canConfirm ? styles.ready : ''}`}>
                                    {canConfirm ? <CheckCircle2 size={18} /> : <PackageCheck size={18} />}
                                    <span>
                                        <strong>
                                            {canConfirm
                                                ? 'Đã hoàn tất checklist — có thể đóng gói'
                                                : `Còn ${Math.max(0, totalQuantity - verifiedQuantity)} cuốn cần quét và kiểm tra`}
                                        </strong>
                                        <small>
                                            {canConfirm
                                                ? 'Kiểm tra lại thông tin giao nhận trước khi xác nhận cuối.'
                                                : 'Nút xác nhận chỉ mở khi mọi đầu sách đủ số lần quét và đã đạt ngoại quan.'}
                                        </small>
                                    </span>
                                </div>

                                <label className={styles.noteField}>
                                    <span>Ghi chú đóng gói <small>(không bắt buộc)</small></span>
                                    <textarea
                                        rows={2}
                                        maxLength={500}
                                        value={packingNote}
                                        placeholder="Ví dụ: Đã bọc chống sốc và chống ẩm..."
                                        onChange={(event) => setPackingNote(event.target.value)}
                                    />
                                    <small>{packingNote.length}/500</small>
                                </label>

                                <label className={styles.checkbox}>
                                    <input
                                        type="checkbox"
                                        checked={issue}
                                        onChange={(event) => setIssue(event.target.checked)}
                                    />
                                    <span>
                                        <XCircle size={15} /> Phát hiện thiếu sách, sai sách hoặc hư hỏng
                                    </span>
                                </label>
                                {issue && (
                                    <textarea
                                        className={styles.issueReason}
                                        rows={3}
                                        maxLength={1000}
                                        value={reason}
                                        placeholder="Mô tả rõ đầu sách, số lượng và tình trạng để kho xử lý..."
                                        onChange={(event) => setReason(event.target.value)}
                                    />
                                )}
                            </>
                        )}

                        {prepared && (
                            <>
                                {(detail.packedBy || detail.packedAt) && (
                                    <p className={styles.statusMeta}>
                                        Xác nhận bởi <b>{detail.packedBy || 'Nhân viên kho'}</b>
                                        {detail.packedAt ? ` · ${workflowDateTime(detail.packedAt)}` : ''}
                                    </p>
                                )}
                                <PackingWaybill detail={detail} />
                            </>
                        )}

                        {!prepared && detail.canConfirmPacking === false && (
                            <div className={styles.alert}>
                                <AlertTriangle size={16} />
                                Đơn không còn ở trạng thái “Đã xác nhận”, nên không thể đóng gói lại.
                            </div>
                        )}

                        {packing.error && <WorkflowError message={packing.error} />}
                    </>
                )}
            </div>

            <div className={common.dialogFooter}>
                <button type="button" className={common.secondary} onClick={close} disabled={packing.busy}>Đóng</button>
                {detail && !prepared && detail.canConfirmPacking !== false && (issue ? (
                    <button
                        type="button"
                        className={common.danger}
                        disabled={packing.busy || !reason.trim()}
                        onClick={() => void packing.save(reason.trim())}
                    >
                        {packing.busy ? 'Đang ghi nhận...' : 'Báo sự cố kho'}
                    </button>
                ) : (
                    <button
                        type="button"
                        className={common.primary}
                        disabled={packing.busy || !canConfirm}
                        onClick={() => setConfirmOpen(true)}
                    >
                        <PackageCheck size={15} /> Kiểm tra lại & xác nhận đóng gói
                    </button>
                ))}
            </div>

            {detail && verification && (
                <PackingConfirmationDialog
                    open={confirmOpen}
                    detail={detail}
                    busy={packing.busy}
                    onCancel={() => setConfirmOpen(false)}
                    onConfirm={() => {
                        void (async () => {
                            const saved = await packing.save(undefined, verification);
                            if (saved) setConfirmOpen(false);
                        })();
                    }}
                />
            )}
        </WorkflowModal>
    );
}

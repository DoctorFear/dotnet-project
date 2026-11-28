import { AlertTriangle, CheckCircle2, PackageCheck, Printer, X } from 'lucide-react';
import type { PackingDetail } from '../../../types/workflow';
import styles from './PackingConfirmationDialog.module.css';

interface PackingConfirmationDialogProps {
    open: boolean;
    detail: PackingDetail;
    busy: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

export default function PackingConfirmationDialog({
    open,
    detail,
    busy,
    onCancel,
    onConfirm,
}: PackingConfirmationDialogProps) {
    if (!open) return null;
    const quantity = detail.items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <div className={styles.backdrop} role="presentation" onMouseDown={() => !busy && onCancel()}>
            <section
                className={styles.dialog}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="packing-confirm-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <header>
                    <span><PackageCheck size={20} /></span>
                    <div>
                        <strong id="packing-confirm-title">Xác nhận hoàn tất đóng gói</strong>
                        <small>{detail.orderCode || `ORD-${String(detail.orderId).padStart(8, '0')}`}</small>
                    </div>
                    <button type="button" aria-label="Đóng" disabled={busy} onClick={onCancel}><X size={18} /></button>
                </header>
                <div className={styles.body}>
                    <div className={styles.verified}>
                        <CheckCircle2 size={18} />
                        <span>
                            <strong>Đã xác minh đủ {quantity} cuốn</strong>
                            <small>Tất cả mã sách và kiểm tra ngoại quan đã hoàn tất.</small>
                        </span>
                    </div>
                    <dl>
                        <div><dt>Người nhận</dt><dd>{detail.customerName}</dd></div>
                        <div><dt>Vận chuyển</dt><dd>{detail.shippingCarrier || 'AncientBook Delivery'}</dd></div>
                        <div><dt>Ưu tiên</dt><dd>{detail.deliveryPriority === 'Express' ? 'Hỏa tốc' : 'Đơn thường'}</dd></div>
                        <div><dt>Giao đến</dt><dd>{detail.shippingAddress}</dd></div>
                    </dl>
                    <p className={styles.warning}>
                        <AlertTriangle size={15} />
                        Sau khi xác nhận, đơn chuyển sang “Đã chuẩn bị”, sẵn sàng phân công Shipper và phiếu giao hàng sẽ được tạo.
                    </p>
                </div>
                <footer>
                    <button type="button" className={styles.cancel} disabled={busy} onClick={onCancel}>Quay lại kiểm tra</button>
                    <button type="button" className={styles.confirm} disabled={busy} onClick={onConfirm}>
                        <Printer size={15} /> {busy ? 'Đang xác nhận...' : 'Xác nhận & tạo phiếu giao hàng'}
                    </button>
                </footer>
            </section>
        </div>
    );
}

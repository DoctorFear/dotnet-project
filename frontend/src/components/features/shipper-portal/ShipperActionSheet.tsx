import {
    CheckCircle2,
    Truck,
    Wallet,
    XCircle,
} from 'lucide-react';
import type { DeliveryStatus } from '../../../types/workflow';
import { useShipperPortal } from '../../../hooks/useShipperPortal';
import { WorkflowError, WorkflowModal } from '../workflow/WorkflowShared';
import { workflowMoney } from '../../../utils/workflowPresentation';
import common from '../workflow/Workflow.module.css';
import styles from './ShipperPortal.module.css';
import DeliveryInstructionCard from './DeliveryInstructionCard';

type Shipper = ReturnType<typeof useShipperPortal>;

interface ShipperActionSheetProps {
    shipper: Shipper;
    result: 'Completed' | 'Failed' | '';
    setResult: (value: 'Completed' | 'Failed' | '') => void;
    reason: string;
    setReason: (value: string) => void;
    note: string;
    setNote: (value: string) => void;
    codConfirmed: boolean;
    setCodConfirmed: (value: boolean) => void;
    valid: boolean;
}

export default function ShipperActionSheet({
    shipper,
    result,
    setResult,
    reason,
    setReason,
    note,
    setNote,
    codConfirmed,
    setCodConfirmed,
    valid,
}: ShipperActionSheetProps) {
    const selected = shipper.detail;
    if (!shipper.action || !selected) return null;
    return (
        <WorkflowModal
            sheet
            title={
                shipper.action === 'start'
                    ? 'Bắt đầu giao hàng'
                    : shipper.action === 'return'
                        ? 'Xác nhận thu hồi hoàn trả'
                        : 'Cập nhật giao hàng'
            }
            busy={shipper.busy}
            onClose={() => {
                shipper.setAction(null);
                shipper.setError('');
            }}
        >
            <div className={common.dialogBody}>
                <p className={common.muted}>
                    Đơn {selected.orderCode} · {selected.customerName}
                </p>
                <DeliveryInstructionCard delivery={selected} compact />
                {shipper.error && <WorkflowError message={shipper.error} />}
                {shipper.action === 'start' ? (
                    <div className={common.info}>
                        <Truck size={24} />
                        <p>
                            Xác nhận bạn đã nhận đủ sách từ kho và sẵn sàng giao đến khách hàng.
                        </p>
                    </div>
                ) : shipper.action === 'return' ? (
                    <div className={common.info}>
                        <CheckCircle2 size={24} />
                        <div>
                            <strong>Đã nhận lại đúng sách và đủ số lượng</strong>
                            <p>
                                Xác nhận này sẽ hoàn tất thu hồi, nhập lại kho, đối soát hoàn tiền
                                và thu hồi F-Point của đơn. Thao tác không thể hoàn tác.
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className={styles.outcomes}>
                            <button
                                type="button"
                                aria-pressed={result === 'Completed'}
                                onClick={() => setResult('Completed')}
                            >
                                <CheckCircle2 size={25} />
                                <strong>Giao thành công</strong>
                                <small>Đã giao đủ sách cho khách</small>
                            </button>
                            <button
                                type="button"
                                aria-pressed={result === 'Failed'}
                                onClick={() => setResult('Failed')}
                            >
                                <XCircle size={25} />
                                <strong>Giao thất bại</strong>
                                <small>Ghi nhận lý do và báo Staff</small>
                            </button>
                        </div>
                        {result === 'Completed' && (
                            <div className={common.info}>
                                <Wallet size={22} />
                                <div>
                                    <strong>
                                        {selected.codAmount
                                            ? `Thu đủ COD: ${workflowMoney(selected.codAmount)}`
                                            : 'Đơn đã thanh toán trước'}
                                    </strong>
                                    <p>
                                        Điểm thưởng của khách sẽ được ghi chờ duyệt theo thời hạn
                                        đổi trả.
                                    </p>
                                </div>
                            </div>
                        )}
                        {result === 'Completed' && selected.codAmount > 0 && (
                            <label className={common.checkbox}>
                                <input
                                    type="checkbox"
                                    checked={codConfirmed}
                                    onChange={(event) => setCodConfirmed(event.target.checked)}
                                />
                                Tôi đã thu đủ {workflowMoney(selected.codAmount)} từ khách.
                            </label>
                        )}
                        {result === 'Failed' && (
                            <>
                                <label className={common.field}>
                                    Lý do giao thất bại <span>*</span>
                                    <select
                                        value={reason}
                                        onChange={(event) => setReason(event.target.value)}
                                    >
                                        <option value="">Chọn lý do</option>
                                        {shipper.reasons.map((item) => (
                                            <option key={item.id} value={item.id}>
                                                {item.reasonText}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className={common.field}>
                                    Ghi chú thêm
                                    <textarea
                                        maxLength={500}
                                        rows={3}
                                        placeholder="Mô tả thêm tình huống giao hàng (không bắt buộc)"
                                        value={note}
                                        onChange={(event) => setNote(event.target.value)}
                                    />
                                    <small>{note.length}/500 ký tự</small>
                                </label>
                            </>
                        )}
                    </>
                )}
            </div>
            <footer className={common.dialogFooter}>
                <button
                    type="button"
                    className={common.secondary}
                    disabled={shipper.busy}
                    onClick={() => shipper.setAction(null)}
                >
                    Quay lại
                </button>
                <button
                    type="button"
                    className={common.primary}
                    disabled={!valid || shipper.busy}
                    onClick={() =>
                        void shipper.submit({
                            newStatus:
                                shipper.action === 'start'
                                    ? 'Shipping'
                                    : shipper.action === 'return'
                                        ? 'Returned'
                                        : (result as DeliveryStatus),
                            ...(result === 'Failed'
                                ? { failureReasonId: Number(reason), failureNote: note.trim() }
                                : {}),
                            ...(result === 'Completed' && selected.codAmount > 0
                                ? { codCollectedAmount: selected.codAmount }
                                : {}),
                        })
                    }
                >
                    {shipper.busy ? 'Đang cập nhật...' : 'Xác nhận'}
                </button>
            </footer>
        </WorkflowModal>
    );
}

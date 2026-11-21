import { CheckCircle2 } from 'lucide-react';
import { useLoyalty } from '../../../hooks/useLoyalty';
import { number, WorkflowError, WorkflowModal } from '../workflow/WorkflowShared';
import common from '../workflow/Workflow.module.css';

type Loyalty = ReturnType<typeof useLoyalty>;

interface ReceiptConfirmModalProps {
    loyalty: Loyalty;
    accepted: boolean;
    setAccepted: (value: boolean) => void;
}

export default function ReceiptConfirmModal({
    loyalty,
    accepted,
    setAccepted,
}: ReceiptConfirmModalProps) {
    if (!loyalty.receipt) return null;
    return (
        <WorkflowModal
            title="Xác nhận đã nhận hàng"
            busy={loyalty.busy}
            onClose={() => loyalty.setReceipt(null)}
        >
            <div className={common.dialogBody}>
                <div className={common.info}>
                    <CheckCircle2 size={25} />
                    <div>
                        <strong>Đơn ORD-{loyalty.receipt.orderId}</strong>
                        <p>
                            {number(loyalty.receipt.pendingPoints)} F-Point sẽ chuyển
                            thành khả dụng khi bạn xác nhận.
                        </p>
                    </div>
                </div>
                {loyalty.error && <WorkflowError message={loyalty.error} />}
                <p className={common.muted}>
                    Chỉ xác nhận sau khi bạn đã nhận đủ sách và kiểm tra tình trạng
                    hàng.
                </p>
                <label className={common.checkbox}>
                    <input
                        type="checkbox"
                        checked={accepted}
                        onChange={(event) => setAccepted(event.target.checked)}
                    />
                    Tôi đã nhận hàng và đồng ý kết thúc quyền đổi trả/hoàn tiền của
                    đơn này theo quy định.
                </label>
                {!loyalty.receipt.canConfirmReceipt && (
                    <WorkflowError message="Đơn không còn đủ điều kiện xác nhận nhận hàng. Vui lòng tải lại dữ liệu." />
                )}
            </div>
            <footer className={common.dialogFooter}>
                <button
                    type="button"
                    className={common.secondary}
                    disabled={loyalty.busy}
                    onClick={() => loyalty.setReceipt(null)}
                >
                    Để sau
                </button>
                <button
                    type="button"
                    className={common.primary}
                    disabled={
                        !accepted || !loyalty.receipt.canConfirmReceipt || loyalty.busy
                    }
                    onClick={() => void loyalty.confirm()}
                >
                    {loyalty.busy ? 'Đang xác nhận...' : 'Xác nhận nhận hàng'}
                </button>
            </footer>
        </WorkflowModal>
    );
}

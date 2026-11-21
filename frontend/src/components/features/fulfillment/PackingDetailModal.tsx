import {
    AlertTriangle,
    CheckCircle2,
    MapPin,
    Phone,
    X,
} from 'lucide-react';
import BookCover from '../../common/BookCover';
import { money, WorkflowError, WorkflowModal } from '../workflow/WorkflowShared';
import { useFulfillment } from '../../../hooks/useFulfillment';
import common from '../workflow/Workflow.module.css';
import styles from './Fulfillment.module.css';

type Fulfillment = ReturnType<typeof useFulfillment>;

interface PackingDetailModalProps {
    packing: Fulfillment;
    issue: boolean;
    reason: string;
    checked: boolean;
    setIssue: (value: boolean) => void;
    setReason: (value: string) => void;
    setChecked: (value: boolean) => void;
}

export default function PackingDetailModal({
    packing,
    issue,
    reason,
    checked,
    setIssue,
    setReason,
    setChecked,
}: PackingDetailModalProps) {
    if (!packing.selected) return null;
    return (
        <WorkflowModal
            title={`Soạn đơn ORD-${packing.selected.orderId}`}
            busy={packing.busy}
            onClose={() => packing.setSelected(null)}
        >
            <div className={common.dialogBody}>
                <div className={styles.recipient}>
                    <span className={common.eyebrow}>THÔNG TIN NGƯỜI NHẬN</span>
                    <h3>{packing.selected.customerName}</h3>
                    <p>
                        <Phone size={14} />
                        {packing.selected.receiverPhone || 'Chưa cập nhật số điện thoại'}
                    </p>
                    <p>
                        <MapPin size={14} />
                        {packing.selected.shippingAddress}
                    </p>
                </div>
                {packing.error && <WorkflowError message={packing.error} />}
                {packing.selected.packingIssue && (
                    <div className={styles.issueNotice}>
                        <AlertTriangle size={18} />
                        <div>
                            <strong>Sự cố đã ghi nhận</strong>
                            <p>{packing.selected.packingIssue}</p>
                        </div>
                    </div>
                )}
                <section>
                    <h3 className={styles.sectionTitle}>
                        Sách cần đóng gói{' '}
                        <span>
                            {packing.selected.items.reduce((sum, item) => sum + item.quantity, 0)}{' '}
                            cuốn
                        </span>
                    </h3>
                    {packing.selected.items.map((item, index) => (
                        <div className={common.bookRow} key={`${item.bookId}-${index}`}>
                            <BookCover
                                src={item.bookCover ?? undefined}
                                title={item.bookTitle}
                                className={common.bookCover}
                            />
                            <div>
                                <h3>{item.bookTitle}</h3>
                                <p>{money(item.unitPrice)} / cuốn</p>
                            </div>
                            <strong className={styles.quantity}>× {item.quantity}</strong>
                        </div>
                    ))}
                </section>
                {issue ? (
                    <div className={styles.issueForm}>
                        <div className={common.actionRow}>
                            <strong>Báo cáo sự cố kho</strong>
                            <button
                                type="button"
                                className={common.textButton}
                                aria-label="Đóng biểu mẫu sự cố"
                                onClick={() => setIssue(false)}
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <label className={common.field}>
                            Lý do sự cố
                            <textarea
                                value={reason}
                                maxLength={1000}
                                rows={3}
                                onChange={(event) => setReason(event.target.value)}
                                placeholder="Ví dụ: sách bị hư, cần kiểm tra lại trước khi đóng gói..."
                            />
                            <small>
                                {reason.length}/1.000 ký tự · Đơn giữ nguyên trạng thái Đã xác nhận.
                            </small>
                        </label>
                    </div>
                ) : (
                    <label className={common.checkbox}>
                        <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) => setChecked(event.target.checked)}
                        />
                        Tôi đã đối chiếu đúng sách, đủ số lượng và đóng gói hoàn tất.
                    </label>
                )}
            </div>
            <footer className={common.dialogFooter}>
                {issue ? (
                    <>
                        <button
                            type="button"
                            className={common.secondary}
                            disabled={packing.busy}
                            onClick={() => setIssue(false)}
                        >
                            Quay lại
                        </button>
                        <button
                            type="button"
                            className={common.primary}
                            disabled={packing.busy || !reason.trim()}
                            onClick={() =>
                                void packing.save(reason.trim()).then((saved) => {
                                    if (saved) {
                                        setIssue(false);
                                        setReason('');
                                    }
                                })
                            }
                        >
                            {packing.busy ? 'Đang gửi...' : 'Gửi báo cáo sự cố'}
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            type="button"
                            className={common.secondary}
                            disabled={packing.busy}
                            onClick={() => setIssue(true)}
                        >
                            <AlertTriangle size={15} /> Báo sự cố
                        </button>
                        <button
                            type="button"
                            className={common.primary}
                            disabled={!checked || packing.busy}
                            onClick={() => void packing.save()}
                        >
                            <CheckCircle2 size={16} />
                            {packing.busy ? 'Đang lưu...' : 'Xác nhận đóng gói xong'}
                        </button>
                    </>
                )}
            </footer>
        </WorkflowModal>
    );
}

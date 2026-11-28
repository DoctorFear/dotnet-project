import { Banknote, MapPinned, Phone, StickyNote, Truck, UserRound } from 'lucide-react';
import type { PackingDetail } from '../../../types/workflow';
import { workflowMoney } from '../../../utils/workflowPresentation';
import styles from './PackingOrderSummary.module.css';

interface PackingOrderSummaryProps {
    detail: PackingDetail;
}

export default function PackingOrderSummary({ detail }: PackingOrderSummaryProps) {
    const priorityLabel = detail.deliveryPriority === 'Express' ? 'Hỏa tốc' : 'Đơn thường';

    return (
        <section className={styles.summary} aria-label="Thông tin giao nhận">
            <div className={styles.heading}>
                <span>Thông tin giao nhận</span>
                <b className={detail.deliveryPriority === 'Express' ? styles.express : ''}>
                    {priorityLabel}
                </b>
            </div>
            <div className={styles.grid}>
                <div>
                    <UserRound size={15} />
                    <span><small>Người nhận</small><strong>{detail.customerName}</strong></span>
                </div>
                <div>
                    <Phone size={15} />
                    <span><small>Số điện thoại</small><strong>{detail.receiverPhone || 'Chưa cung cấp'}</strong></span>
                </div>
                <div className={styles.wide}>
                    <MapPinned size={15} />
                    <span><small>Địa chỉ giao hàng</small><strong>{detail.shippingAddress}</strong></span>
                </div>
                <div>
                    <Truck size={15} />
                    <span><small>Đơn vị vận chuyển</small><strong>{detail.shippingCarrier || 'AncientBook Delivery'}</strong></span>
                </div>
                <div>
                    <Banknote size={15} />
                    <span>
                        <small>Thanh toán</small>
                        <strong>{detail.isPaid ? 'Đã thanh toán' : `Thu hộ ${workflowMoney(detail.finalAmount ?? 0)}`}</strong>
                    </span>
                </div>
                <div className={`${styles.wide} ${styles.note}`}>
                    <StickyNote size={15} />
                    <span>
                        <small>Ghi chú giao hàng</small>
                        <strong>{detail.deliveryNote?.trim() || 'Không có ghi chú giao hàng'}</strong>
                    </span>
                </div>
            </div>
        </section>
    );
}

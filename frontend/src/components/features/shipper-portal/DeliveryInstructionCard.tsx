import { AlertCircle, MapPin, PackageCheck, StickyNote, Truck } from 'lucide-react';
import type { DeliveryDetail } from '../../../types/workflow';
import styles from './DeliveryInstructionCard.module.css';

interface DeliveryInstructionCardProps {
    delivery: DeliveryDetail;
    compact?: boolean;
}

export default function DeliveryInstructionCard({ delivery, compact = false }: DeliveryInstructionCardProps) {
    return (
        <section className={`${styles.card} ${compact ? styles.compact : ''}`} aria-label="Thông tin cần kiểm tra khi giao hàng">
            <header>
                <span><PackageCheck size={16} /> Thông tin kiện giao</span>
                <b>{delivery.deliveryPriority === 'Express' ? 'Hỏa tốc' : 'Đơn thường'}</b>
            </header>
            <div className={styles.rows}>
                <div>
                    <MapPin size={15} />
                    <span><small>Giao đến</small><strong>{delivery.shippingAddress}</strong></span>
                </div>
                <div>
                    <Truck size={15} />
                    <span>
                        <small>Vận đơn · Đơn vị vận chuyển</small>
                        <strong>{delivery.waybillCode || 'Chưa có mã vận đơn'} · {delivery.shippingCarrier || 'AncientBook Delivery'}</strong>
                    </span>
                </div>
                <div className={styles.note}>
                    {delivery.deliveryNote?.trim() ? <StickyNote size={15} /> : <AlertCircle size={15} />}
                    <span>
                        <small>Ghi chú giao hàng</small>
                        <strong>{delivery.deliveryNote?.trim() || 'Không có ghi chú giao hàng'}</strong>
                    </span>
                </div>
            </div>
        </section>
    );
}

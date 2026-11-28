import { CheckCircle2, PackageCheck, Printer, Truck } from 'lucide-react';
import type { PackingDetail } from '../../../types/workflow';
import { workflowDateTime, workflowMoney } from '../../../utils/workflowPresentation';
import styles from './PackingWaybill.module.css';

interface PackingWaybillProps {
    detail: PackingDetail;
}

export default function PackingWaybill({ detail }: PackingWaybillProps) {
    const totalQuantity = detail.items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <section className={styles.section}>
            <div className={styles.success}>
                <CheckCircle2 size={19} />
                <span>
                    <strong>Đóng gói đã được ghi nhận</strong>
                    <small>Phiếu giao hàng {detail.waybillCode} đã sẵn sàng để in.</small>
                </span>
                <button type="button" onClick={() => window.print()}>
                    <Printer size={15} /> In phiếu giao hàng
                </button>
            </div>

            <article className={styles.printSheet} aria-label={`Phiếu giao hàng ${detail.waybillCode}`}>
                <header>
                    <div className={styles.brand}>
                        <PackageCheck size={25} />
                        <span><b>ANCIENT BOOK</b><small>PHIẾU GIAO HÀNG</small></span>
                    </div>
                    <div className={styles.code}>
                        <small>MÃ VẬN ĐƠN</small>
                        <strong>{detail.waybillCode}</strong>
                    </div>
                </header>
                <div className={styles.route}>
                    <div>
                        <small>GIAO ĐẾN</small>
                        <strong>{detail.customerName}</strong>
                        <span>{detail.receiverPhone || 'Không có số điện thoại'}</span>
                        <p>{detail.shippingAddress}</p>
                    </div>
                    <div>
                        <Truck size={17} />
                        <small>ĐƠN VỊ VẬN CHUYỂN</small>
                        <strong>{detail.shippingCarrier || 'AncientBook Delivery'}</strong>
                        <span>{detail.deliveryPriority === 'Express' ? 'Hỏa tốc' : 'Đơn thường'}</span>
                    </div>
                </div>
                {detail.deliveryNote?.trim() && (
                    <p className={styles.deliveryNote}><b>Ghi chú giao hàng:</b> {detail.deliveryNote}</p>
                )}
                <div className={styles.meta}>
                    <span><small>MÃ ĐƠN</small><b>{detail.orderCode || `ORD-${String(detail.orderId).padStart(8, '0')}`}</b></span>
                    <span><small>NGÀY ĐẶT</small><b>{detail.orderDate ? workflowDateTime(detail.orderDate) : '—'}</b></span>
                    <span><small>SỐ LƯỢNG</small><b>{totalQuantity} cuốn</b></span>
                    <span><small>THU HỘ (COD)</small><b>{detail.isPaid ? '0 ₫ · Đã thanh toán' : workflowMoney(detail.finalAmount ?? 0)}</b></span>
                </div>
                <div className={styles.items}>
                    {detail.items.map((item) => (
                        <div key={item.bookId}>
                            <span>{item.bookTitle}</span>
                            <b>x{item.quantity}</b>
                        </div>
                    ))}
                </div>
                <footer>
                    <span>Người gửi xác nhận</span>
                    <span>Shipper xác nhận</span>
                    <span>Người nhận xác nhận</span>
                </footer>
            </article>
        </section>
    );
}

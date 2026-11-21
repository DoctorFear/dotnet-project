import { useState } from 'react';
import {
    ArrowRight,
    CheckCircle2,
    ClipboardCheck,
    Package,
    Truck,
} from 'lucide-react';
import AdminLayout from '../components/layout/admin/AdminLayout';
import ToastNotification from '../components/common/ToastNotification';
import PackingOrdersPanel from '../components/features/fulfillment/PackingOrdersPanel';
import PackingDetailModal from '../components/features/fulfillment/PackingDetailModal';
import { useFulfillment } from '../hooks/useFulfillment';
import styles from '../components/features/fulfillment/Fulfillment.module.css';

export default function FulfillmentPage() {
    const packing = useFulfillment();
    const [issue, setIssue] = useState(false);
    const [reason, setReason] = useState('');
    const [checked, setChecked] = useState(false);

    const openDetail = (orderId: number) => {
        setChecked(false);
        setIssue(false);
        setReason('');
        void packing.select(orderId);
    };

    return (
        <AdminLayout
            activePage="packing"
            title="Tiếp nhận & đóng gói"
            subtitle="Soạn đủ sách, đóng gói và chuyển đơn sang chờ phân công giao hàng"
            badge="Vận hành kho"
        >
            <ToastNotification
                toasts={packing.notifications.toasts}
                onClose={packing.notifications.dismissToast}
            />
            <div className={styles.summary}>
                <div>
                    <span className={styles.summaryIcon}>
                        <Package size={25} />
                    </span>
                    <section>
                        <span>ĐƠN CHỜ ĐÓNG GÓI</span>
                        <strong>{packing.orders.data?.totalCount ?? '—'}</strong>
                        <small>Đơn sách giấy đã được xác nhận</small>
                    </section>
                </div>
                <div className={styles.process}>
                    <span>
                        <CheckCircle2 size={16} /> Đã xác nhận
                    </span>
                    <ArrowRight size={14} />
                    <strong>
                        <Package size={16} /> Đóng gói
                    </strong>
                    <ArrowRight size={14} />
                    <span>
                        <Truck size={16} /> Chờ phân công
                    </span>
                </div>
            </div>
            <PackingOrdersPanel packing={packing} onOpenDetail={openDetail} />
            <p className={styles.scopeNote}>
                <ClipboardCheck size={15} /> Chỉ tiếp nhận đơn Đã xác nhận. Phân công Shipper được thực hiện
                tại màn hình điều phối.
            </p>
            <PackingDetailModal
                packing={packing}
                issue={issue}
                reason={reason}
                checked={checked}
                setIssue={setIssue}
                setReason={setReason}
                setChecked={setChecked}
            />
        </AdminLayout>
    );
}

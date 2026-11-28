import { useState } from 'react';
import {
    ClipboardList,
    UserRound,
} from 'lucide-react';
import { useShipperPortal } from '../hooks/useShipperPortal';
import { useUser } from '../context/UserContext';
import { useWorkflow } from '../context/WorkflowContext';
import { useAuthAction } from '../hooks/useAuthAction';
import type { DeliveryStatus } from '../types/workflow';
import ToastNotification from '../components/common/ToastNotification';
import ShipperHeader from '../components/features/shipper-portal/ShipperHeader';
import ShipperOrderList from '../components/features/shipper-portal/ShipperOrderList';
import ShipperActionSheet from '../components/features/shipper-portal/ShipperActionSheet';
import ShipperAccountSheet from '../components/features/shipper-portal/ShipperAccountSheet';
import ShipperNetworkStatus from '../components/features/shipper-portal/ShipperNetworkStatus';
import styles from '../components/features/shipper-portal/ShipperPortal.module.css';

export default function ShipperPortalPage() {
    const shipper = useShipperPortal();
    const { user } = useUser();
    const { preview } = useWorkflow();
    const { handleLogout } = useAuthAction();
    const [account, setAccount] = useState(false);
    const [result, setResult] = useState<'Completed' | 'Failed' | ''>('');
    const [reason, setReason] = useState('');
    const [note, setNote] = useState('');
    const [codConfirmed, setCodConfirmed] = useState(false);

    const openAction = (id: number, status: DeliveryStatus) => {
        setResult('');
        setReason('');
        setNote('');
        setCodConfirmed(false);
        void shipper.openAction(id, status);
    };
    const selected = shipper.detail;
    const valid =
        shipper.action === 'start' ||
        shipper.action === 'return' ||
        (result === 'Failed' && !!reason) ||
        (result === 'Completed' && (selected?.codAmount === 0 || codConfirmed));

    return (
        <div className={styles.viewport}>
            <div className={styles.phone}>
                <ToastNotification
                    toasts={shipper.notifications.toasts}
                    onClose={shipper.notifications.dismissToast}
                />
                <ShipperHeader
                    name={preview ? 'Hoàng Khang' : user?.fullName || user?.username || 'bạn'}
                    onReload={shipper.orders.reload}
                />
                <ShipperNetworkStatus />
                <ShipperOrderList shipper={shipper} onOpenAction={openAction} />
                <nav className={styles.bottomNav} aria-label="Điều hướng Shipper">
                    <button
                        type="button"
                        aria-current="page"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                        <ClipboardList size={21} />
                        Đơn hàng
                    </button>
                    <button type="button" onClick={() => setAccount(true)}>
                        <UserRound size={21} />
                        Tài khoản
                    </button>
                </nav>
                <ShipperActionSheet
                    shipper={shipper}
                    result={result}
                    setResult={setResult}
                    reason={reason}
                    setReason={setReason}
                    note={note}
                    setNote={setNote}
                    codConfirmed={codConfirmed}
                    setCodConfirmed={setCodConfirmed}
                    valid={valid}
                />
                {account && (
                    <ShipperAccountSheet
                        user={user}
                        preview={preview}
                        onClose={() => setAccount(false)}
                        onLogout={handleLogout}
                    />
                )}
            </div>
        </div>
    );
}

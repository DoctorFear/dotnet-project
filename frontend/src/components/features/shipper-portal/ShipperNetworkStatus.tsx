import { useSyncExternalStore } from 'react';
import { WifiOff } from 'lucide-react';
import styles from './ShipperNetworkStatus.module.css';

const subscribe = (notify: () => void) => {
    window.addEventListener('online', notify);
    window.addEventListener('offline', notify);
    return () => {
        window.removeEventListener('online', notify);
        window.removeEventListener('offline', notify);
    };
};

const getSnapshot = () => navigator.onLine;
const getServerSnapshot = () => true;

export default function ShipperNetworkStatus() {
    const online = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    if (online) return null;

    return (
        <div className={styles.banner} role="alert">
            <WifiOff size={17} />
            <span>
                <strong>Mất kết nối mạng</strong>
                <small>Không thể cập nhật trạng thái đơn hàng. Vui lòng kiểm tra kết nối 4G/Wifi và thử lại!</small>
            </span>
        </div>
    );
}

import { RefreshCw, ShieldCheck } from 'lucide-react';
import styles from './ShipperPortal.module.css';

interface ShipperHeaderProps {
    name: string;
    onReload: () => void;
}

export default function ShipperHeader({ name, onReload }: ShipperHeaderProps) {
    return (
        <header className={styles.header}>
            <div className={styles.topline}>
                <span className={styles.brand}>
                    ancient<span>BOOK</span>
                    <i />
                </span>
                <span className={styles.portal}>SHIPPER</span>
                <button type="button" aria-label="Làm mới đơn hàng" onClick={onReload}>
                    <RefreshCw size={19} />
                </button>
            </div>
            <p>
                Xin chào, {name} <span className={styles.wave}>✦</span>
            </p>
            <h1>Đơn hàng của tôi</h1>
            <span className={styles.headerCaption}>
                <ShieldCheck size={14} /> Chỉ hiển thị đơn được phân công cho bạn
            </span>
        </header>
    );
}

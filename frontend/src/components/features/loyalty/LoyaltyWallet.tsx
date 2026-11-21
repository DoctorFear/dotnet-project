import { Link } from 'react-router-dom';
import {
    Award,
    ChevronRight,
    Clock3,
    Coins,
    ShieldCheck,
    Wallet,
} from 'lucide-react';
import type { PointBalance } from '../../../types/workflow';
import { money, number } from '../workflow/WorkflowShared';
import common from '../workflow/Workflow.module.css';
import styles from './Loyalty.module.css';

interface LoyaltyWalletProps {
    balance: PointBalance;
    membership: boolean;
    path: (tab: string) => string;
}

export default function LoyaltyWallet({ balance, membership, path }: LoyaltyWalletProps) {
    return (
        <div className={styles.heroGrid}>
            <section className={styles.wallet}>
                <div className={styles.walletTop}>
                    <span>
                        <Wallet size={17} /> VÍ F-POINT
                    </span>
                    <span>
                        ancient<span>BOOK</span>
                    </span>
                </div>
                <p>Điểm khả dụng</p>
                <strong className={styles.balance}>
                    {number(balance.currentPoints)}
                    <span>F-Point</span>
                </strong>
                <p className={styles.value}>
                    Tương đương {money(balance.currentPoints * 100)} giảm giá
                </p>
                <div className={styles.walletBottom}>
                    <span>
                        <Clock3 size={15} /> Điểm chờ duyệt
                    </span>
                    <strong>
                        {number(balance.pendingPoints)} <small>điểm</small>
                    </strong>
                </div>
                <Coins className={styles.watermark} size={135} />
            </section>
            <section className={styles.tierSummary}>
                <span className={common.eyebrow}>HẠNG THÀNH VIÊN HIỆN TẠI</span>
                <div className={styles.tierIdentity}>
                    <span className={styles.medal}>
                        <Award size={31} />
                    </span>
                    <div>
                        <h2>Hạng {balance.tierName}</h2>
                        <p>Tích {balance.pointRate}% F-Point mỗi đơn hợp lệ</p>
                    </div>
                </div>
                <Link to={path(membership ? 'points' : 'membership')}>
                    {membership ? 'Xem ví F-Point' : 'Khám phá quyền lợi'}
                    <ChevronRight size={14} />
                </Link>
                <span className={styles.tierFoot}>
                    <ShieldCheck size={12} /> Hạng được hệ thống tự động cập nhật
                </span>
            </section>
        </div>
    );
}

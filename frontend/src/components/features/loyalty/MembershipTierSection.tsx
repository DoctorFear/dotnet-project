import {
    Award,
    Check,
    Info,
} from 'lucide-react';
import type { MembershipTier } from '../../../types/workflow';
import { workflowMoney } from '../../../utils/workflowPresentation';
import common from '../workflow/Workflow.module.css';
import styles from './Loyalty.module.css';

interface MembershipTierSectionProps {
    tiers: MembershipTier[];
    tierName: string;
    currentIndex: number;
}

export default function MembershipTierSection({
    tiers,
    tierName,
    currentIndex,
}: MembershipTierSectionProps) {
    return (
        <>
            <div className={styles.tierCards}>
                {tiers.map((tier, index) => (
                    <article
                        key={tier.id}
                        className={`${styles.tierCard} ${styles[`tier${index}`]}`}
                    >
                        <div className={styles.tierCardTop}>
                            <Award size={35} />
                            <span>
                                {tier.tierName === tierName
                                    ? 'Hạng hiện tại'
                                    : index > currentIndex
                                        ? 'Hạng tiếp theo'
                                        : 'Đã đạt'}
                            </span>
                        </div>
                        <h2>{tier.tierName}</h2>
                        <p>Chi tiêu từ {workflowMoney(tier.minSpending)}</p>
                        <strong>
                            {tier.pointRate}%<small>tích điểm F-Point</small>
                        </strong>
                        <ul>
                            <li>
                                <Check size={13} />1 điểm tương đương 100 đ
                            </li>
                            <li>
                                <Check size={13} />
                                {tier.benefits ||
                                    'Tích điểm khi hoàn thành giao dịch hợp lệ.'}
                            </li>
                            <li>
                                <Check size={13} />
                                {index === currentIndex
                                    ? 'Đang áp dụng cho tài khoản của bạn'
                                    : 'Tự động áp dụng khi đủ điều kiện'}
                            </li>
                        </ul>
                    </article>
                ))}
            </div>
            <div className={common.info}>
                <Info size={22} />
                <p>
                    Hệ thống chỉ tính tiền thực trả của đơn hoàn thành và đã thanh
                    toán, không tính trùng hoặc tính đơn đang hoàn trả. Không tự
                    hạ hạng; tỷ lệ mới áp dụng cho các đơn tiếp theo.
                </p>
            </div>
        </>
    );
}

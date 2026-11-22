import { TrendingUp } from 'lucide-react';
import type { MembershipTier, PointBalance } from '../../../types/workflow';
import { workflowMoney } from '../../../utils/workflowPresentation';
import common from '../workflow/Workflow.module.css';
import styles from './Loyalty.module.css';

interface LoyaltyProgressProps {
    balance: PointBalance;
    next?: MembershipTier;
    progress: number;
}

export default function LoyaltyProgress({ balance, next, progress }: LoyaltyProgressProps) {
    return (
        <section className={`${common.panel} ${styles.progressPanel}`}>
            <div className={common.actionRow}>
                <div>
                    <span className={common.eyebrow}>HÀNH TRÌNH THĂNG HẠNG</span>
                    <h3>
                        {next ? (
                            <>
                                Tiến gần hơn đến hạng <span>{next.tierName}</span>
                            </>
                        ) : (
                            'Bạn đang ở hạng thành viên cao nhất'
                        )}
                    </h3>
                </div>
                <TrendingUp size={24} />
            </div>
            <div className={styles.progressLabels}>
                <span>
                    Chi tiêu hợp lệ: <strong>{workflowMoney(balance.totalSpent)}</strong>
                </span>
                {next && (
                    <span>
                        Mốc {next.tierName}: {workflowMoney(next.minSpending)}
                    </span>
                )}
            </div>
            <div
                className={styles.track}
                role="progressbar"
                aria-label="Tiến trình thăng hạng"
                aria-valuenow={Math.round(progress)}
                aria-valuemin={0}
                aria-valuemax={100}
            >
                <span style={{ width: `${progress}%` }} />
            </div>
            <p>
                {next ? (
                    <>
                        Còn{' '}
                        <strong>
                            {workflowMoney(Math.max(0, next.minSpending - balance.totalSpent))}
                        </strong>{' '}
                        để đạt hạng {next.tierName} và tích {next.pointRate}% điểm cho
                        những đơn tiếp theo.
                    </>
                ) : (
                    'Cảm ơn bạn đã đồng hành cùng ancientBOOK.'
                )}
            </p>
        </section>
    );
}

import { Award, CheckCircle2, Coins, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { MembershipTier } from '../../../types/workflow';
import { WorkflowModal } from '../workflow/WorkflowShared';
import { workflowMoney } from '../../../utils/workflowPresentation';
import common from '../workflow/Workflow.module.css';
import styles from './LoyaltyPolicyModal.module.css';

interface LoyaltyPolicyModalProps {
    tiers: MembershipTier[];
    currentTier: string;
    onClose: () => void;
}

export default function LoyaltyPolicyModal({ tiers, currentTier, onClose }: LoyaltyPolicyModalProps) {
    return (
        <WorkflowModal title="Quy tắc tích & tiêu điểm F-Point" onClose={onClose}>
            <div className={common.dialogBody}>
                <div className={styles.intro}>
                    <Coins size={22} />
                    <div>
                        <strong>1 F-Point = 100 đ</strong>
                        <p>Điểm khả dụng được dùng để giảm tiền sách, không giảm phí vận chuyển.</p>
                    </div>
                </div>

                <section className={styles.section}>
                    <h3><Award size={16} /> Đặc quyền từng hạng</h3>
                    <div className={styles.tierTable} role="table" aria-label="Tỷ lệ tích điểm theo hạng">
                        <div className={styles.tableHeading} role="row">
                            <span role="columnheader">Hạng</span>
                            <span role="columnheader">Chi tiêu từ</span>
                            <span role="columnheader">Tích điểm</span>
                        </div>
                        {tiers.map((tier) => (
                            <div className={styles.tableRow} role="row" key={tier.id}>
                                <span role="cell">
                                    {tier.tierName}
                                    {tier.tierName === currentTier && <small>Hiện tại</small>}
                                </span>
                                <span role="cell">{workflowMoney(tier.minSpending)}</span>
                                <strong role="cell">{tier.pointRate}%</strong>
                            </div>
                        ))}
                    </div>
                </section>

                <section className={styles.rules}>
                    <h3><CheckCircle2 size={16} /> Hạn mức và điều kiện</h3>
                    <ul>
                        <li>Tối đa 1.000 F-Point cho mỗi đơn và không vượt quá tiền sách.</li>
                        <li>Chỉ điểm khả dụng mới được sử dụng; điểm chờ chưa thể tiêu.</li>
                        <li>Đơn bị hủy hoặc hoàn trả hợp lệ được hoàn lại toàn bộ điểm đã dùng.</li>
                        <li>Hạng được tự động nâng theo tổng chi tiêu hợp lệ và không tự động hạ.</li>
                    </ul>
                </section>
            </div>
            <footer className={common.dialogFooter}>
                <button type="button" className={common.secondary} onClick={onClose}>Đóng</button>
                <Link className={styles.shopLink} to="/" onClick={onClose}>
                    <ShoppingBag size={15} /> Mua sách và dùng điểm
                </Link>
            </footer>
        </WorkflowModal>
    );
}

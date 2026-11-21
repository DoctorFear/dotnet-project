import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Award,
    BookOpen,
    Wallet,
} from 'lucide-react';
import { useLoyalty } from '../hooks/useLoyalty';
import { useWorkflow } from '../context/WorkflowContext';
import ToastNotification from '../components/common/ToastNotification';
import LoyaltyWallet from '../components/features/loyalty/LoyaltyWallet';
import LoyaltyProgress from '../components/features/loyalty/LoyaltyProgress';
import MembershipTierSection from '../components/features/loyalty/MembershipTierSection';
import PointsHistorySection from '../components/features/loyalty/PointsHistorySection';
import ReceiptConfirmModal from '../components/features/loyalty/ReceiptConfirmModal';
import {
    MemberShell,
    WorkflowError,
} from '../components/features/workflow/WorkflowShared';
import common from '../components/features/workflow/Workflow.module.css';
import styles from '../components/features/loyalty/Loyalty.module.css';

export default function LoyaltyPage({
    membership = false,
}: {
    membership?: boolean;
}) {
    const loyalty = useLoyalty();
    const { preview } = useWorkflow();
    const [amount, setAmount] = useState('200000');
    const [points, setPoints] = useState('0');
    const [accepted, setAccepted] = useState(false);
    useEffect(() => {
        setAccepted(false);
    }, [loyalty.receipt?.orderId]);
    const data = loyalty.resource.data;
    const balance = data?.balance;
    const tiers = data?.tiers ?? [];
    const currentIndex = tiers.findIndex(
        (tier) => tier.tierName === balance?.tierName,
    );
    const current = tiers[currentIndex] ?? tiers[0];
    const next = tiers[currentIndex + 1];
    const progress = !next
        ? 100
        : Math.max(
              0,
              Math.min(
                  100,
                  (((balance?.totalSpent ?? 0) - (current?.minSpending ?? 0)) /
                      Math.max(1, next.minSpending - (current?.minSpending ?? 0))) *
                      100,
              ),
          );
    const maxPreview = Math.min(
        balance?.currentPoints ?? 0,
        1000,
        Math.floor(Number(amount) / 200),
    );
    const path = (tab: string) =>
        preview
            ? `/preview/huy/${tab}`
            : tab === 'membership'
                ? '/membership'
                : '/f-point';
    return (
        <MemberShell
            title={membership ? 'Hạng thành viên' : 'Ví F-Point của tôi'}
            subtitle={
                membership
                    ? 'Theo dõi hành trình tích lũy và những quyền lợi dành riêng cho bạn.'
                    : 'Tích lũy từ mỗi trang sách. Dùng điểm cho những lần mua tiếp theo.'
            }
        >
            <ToastNotification
                toasts={loyalty.notifications.toasts}
                onClose={loyalty.notifications.dismissToast}
            />
            {loyalty.resource.error ? (
                <WorkflowError
                    message={loyalty.resource.error}
                    retry={loyalty.resource.reload}
                />
            ) : !data || !balance ? (
                <p role="status" className={common.loading}>
                    Đang tải ví điểm và hạng thành viên...
                </p>
            ) : (
                <>
                    <LoyaltyWallet balance={balance} membership={membership} path={path} />
                    <LoyaltyProgress balance={balance} next={next} progress={progress} />
                    <nav className={styles.tabs} aria-label="Ví và quyền lợi thành viên">
                        <Link
                            to={path('points')}
                            aria-current={!membership ? 'page' : undefined}
                        >
                            <Wallet size={15} />
                            Điểm & giao dịch
                        </Link>
                        <Link
                            to={path('membership')}
                            aria-current={membership ? 'page' : undefined}
                        >
                            <Award size={16} />
                            Các hạng thành viên
                        </Link>
                    </nav>
                    {membership ? (
                        <MembershipTierSection
                            tiers={tiers}
                            tierName={balance.tierName}
                            currentIndex={currentIndex}
                        />
                    ) : (
                        <PointsHistorySection
                            loyalty={loyalty}
                            amount={amount}
                            points={points}
                            setAmount={setAmount}
                            setPoints={setPoints}
                            maxPreview={maxPreview}
                        />
                    )}
                    {loyalty.error && !loyalty.receipt && (
                        <WorkflowError message={loyalty.error} />
                    )}
                    <p className={styles.finalNote}>
                        <BookOpen size={14} /> Đơn hàng hoàn tất, niềm vui đọc sách tiếp
                        nối.
                    </p>
                </>
            )}
            <ReceiptConfirmModal
                loyalty={loyalty}
                accepted={accepted}
                setAccepted={setAccepted}
            />
        </MemberShell>
    );
}

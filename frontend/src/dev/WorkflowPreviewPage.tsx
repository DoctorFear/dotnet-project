import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { WorkflowContext } from '../context/WorkflowContext';
import { createWorkflowDemo } from './workflowDemo';
import ShipperPortalPage from '../pages/ShipperPortalPage';
import FulfillmentPage from '../pages/FulfillmentPage';
import LoyaltyPage from '../pages/LoyaltyPage';
import MemberReviewsPage from '../pages/MemberReviewsPage';
import MembershipConfigPage from '../pages/MembershipConfigPage';
import styles from '../components/features/workflow/Workflow.module.css';

export default function WorkflowPreviewPage() {
    const { screen = 'shipper' } = useParams();
    const [api] = useState(createWorkflowDemo);
    const links = [
        { key: 'shipper', label: 'Shipper' },
        { key: 'packing', label: 'Đóng gói' },
        { key: 'points', label: 'Ví F-Point' },
        { key: 'membership', label: 'Hạng thành viên' },
        { key: 'reviews', label: 'Đánh giá' },
        { key: 'tiers', label: 'Cấu hình hạng' },
    ];
    return (
        <WorkflowContext.Provider value={{ api, preview: true }}>
            <div className={styles.previewBar}>
                <div>
                    <strong>Xem thử giao diện của Huy</strong>Dữ liệu mẫu · Thao tác ở đây không thay đổi đơn
                    hàng thật.
                </div>
                <nav aria-label="Các giao diện xem thử">
                    {links.map((link) => (
                        <Link
                            key={link.key}
                            aria-current={screen === link.key ? 'page' : undefined}
                            to={`/preview/huy/${link.key}`}
                        >
                            {link.label}
                        </Link>
                    ))}
                    <button type="button" onClick={() => window.location.reload()}>
                        Đặt lại dữ liệu mẫu
                    </button>
                </nav>
            </div>
            {screen === 'packing' ? (
                <FulfillmentPage />
            ) : screen === 'points' || screen === 'membership' ? (
                <LoyaltyPage membership={screen === 'membership'} />
            ) : screen === 'reviews' ? (
                <MemberReviewsPage />
            ) : screen === 'tiers' ? (
                <MembershipConfigPage />
            ) : (
                <ShipperPortalPage />
            )}
        </WorkflowContext.Provider>
    );
}

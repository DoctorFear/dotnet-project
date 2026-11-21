import { LogOut, ShieldCheck } from 'lucide-react';
import type { UserInfo } from '../../../types/user';
import { WorkflowModal } from '../workflow/WorkflowShared';
import common from '../workflow/Workflow.module.css';

interface ShipperAccountSheetProps {
    user: UserInfo | undefined;
    preview: boolean;
    onClose: () => void;
    onLogout: () => void;
}

export default function ShipperAccountSheet({
    user,
    preview,
    onClose,
    onLogout,
}: ShipperAccountSheetProps) {
    return (
        <WorkflowModal sheet title="Tài khoản Shipper" onClose={onClose}>
            <div className={common.dialogBody}>
                <h3>{preview ? 'Nguyễn Hoàng Khang' : user?.fullName}</h3>
                <p className={common.muted}>
                    {preview ? 'shipper_khang · Tài khoản mẫu' : user?.username}
                </p>
                <div className={common.info}>
                    <ShieldCheck size={23} />
                    <p>
                        Bạn được xem và cập nhật tiến trình các đơn hàng đã được phân công cho
                        mình.
                    </p>
                </div>
                {!preview && (
                    <button type="button" className={common.secondary} onClick={onLogout}>
                        <LogOut size={16} /> Đăng xuất
                    </button>
                )}
            </div>
        </WorkflowModal>
    );
}

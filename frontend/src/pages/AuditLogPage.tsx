import React, { useRef } from 'react';
import { RotateCw } from 'lucide-react';
import AdminLayout from '../components/layout/admin/AdminLayout';
import { AuditLogManagement } from '../components/features/audit-log/AuditLogManagement';
import styles from '../components/features/audit-log/AuditLog.module.css';

export const AuditLogPage: React.FC = () => {
    const resetRef = useRef<(() => void) | null>(null);

    const handleRefresh = () => {
        if (resetRef.current) {
            resetRef.current();
        }
    };

    return (
        <AdminLayout
            activePage="audit-logs"
            title="Nhật ký hoạt động hệ thống (Audit Log)"
            subtitle="Theo dõi trực quan mọi biến động dữ liệu, tài chính, kho hàng và bảo mật"
            badge="UC07 • Kiểm toán hệ thống"
            actions={
                <button
                    type="button"
                    className={styles.btnActionRefresh}
                    onClick={handleRefresh}
                    title="Đưa toàn bộ bộ lọc về trạng thái ban đầu"
                >
                    <RotateCw size={15} />
                    <span>Làm mới bộ lọc</span>
                </button>
            }
        >
            <AuditLogManagement onResetRef={(fn) => { resetRef.current = fn; }} />
        </AdminLayout>
    );
};

export default AuditLogPage;

import React from 'react';
import AdminLayout from '../components/layout/admin/AdminLayout';
import AdminRefundManagement from '../components/features/admin-refunds/AdminRefundManagement';

export const AdminRefundManagementPage: React.FC = () => {
    return (
        <AdminLayout
            activePage="refunds"
            title="Quản lý Trả hàng & Hoàn tiền"
            subtitle="Kiểm tra bằng chứng và phê duyệt yêu cầu hoàn trả từ khách hàng"
            badge="Admin Refund Management"
        >
            <AdminRefundManagement />
        </AdminLayout>
    );
};

export default AdminRefundManagementPage;
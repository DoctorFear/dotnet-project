import React from 'react';
import AdminLayout from '../components/layout/admin/AdminLayout';
import AdminSettingsManagement from '../components/features/admin-settings/AdminSettingsManagement';

export const AdminSettingsPage: React.FC = () => {
    return (
        <AdminLayout
            activePage="settings"
            title="Quản lý cài đặt"
            subtitle="Cấu hình tỉ lệ tích điểm và mức điểm sử dụng tối đa cho đơn hàng"
            badge="Admin Settings Management"
        >
            <AdminSettingsManagement />
        </AdminLayout>
    );
};

export default AdminSettingsPage;

import React from 'react';
import AdminLayout from '../components/layout/admin/AdminLayout';
import AdminSettingsManagement from '../components/features/admin-settings/AdminSettingsManagement';

export const AdminSettingsPage: React.FC = () => {
    return (
        <AdminLayout
            activePage="settings"
            title="Quản lý cài đặt"
            subtitle="Cấu hình các tham số vận hành chung trên toàn hệ thống"
            badge="Admin System Settings"
        >
            <AdminSettingsManagement />
        </AdminLayout>
    );
};

export default AdminSettingsPage;
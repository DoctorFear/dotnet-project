import React from 'react';
import AdminLayout from '../components/layout/admin/AdminLayout';
import AdminOrderManagement from '../components/features/admin-orders/AdminOrderManagement';

export const AdminOrderManagementPage: React.FC = () => {
    return (
        <AdminLayout
            activePage="orders"
            title="Quản lý đơn hàng"
            subtitle="Kiểm tra thông tin, cập nhật trạng thái và duyệt hoàn trả đơn hàng"
            badge="Admin Order Management"
        >
            <AdminOrderManagement />
        </AdminLayout>
    );
};

export default AdminOrderManagementPage;
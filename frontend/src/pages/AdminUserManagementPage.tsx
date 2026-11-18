import React from 'react';
import AdminLayout from '../components/layout/admin/AdminLayout';
import AdminUserManagement from '../components/features/admin-user/AdminUserManagement';

export const AdminUserManagementPage: React.FC = () => {
    return (
        <AdminLayout
            activePage="users"
            title="Quản lý & Phân quyền tài khoản"
            subtitle="Kiểm soát tài khoản, gán quyền và theo dõi trạng thái người dùng toàn hệ thống"
            badge="UC04 • Admin User Management"
        >
            <AdminUserManagement />
        </AdminLayout>
    );
};

export default AdminUserManagementPage;
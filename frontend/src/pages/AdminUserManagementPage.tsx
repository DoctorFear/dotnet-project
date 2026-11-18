import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import AdminLayout from '../components/layout/admin/AdminLayout';
import { AdminUserManagement } from '../components/features/admin-users/AdminUserManagement';
import styles from '../components/features/admin-users/AdminUser.module.css';

export const AdminUserManagementPage: React.FC = () => {
    const [openCreateModal, setOpenCreateModal] = useState(false);

    return (
        <AdminLayout
            activePage="users"
            title="Quản lý & Phân quyền tài khoản"
            subtitle="Kiểm soát tài khoản, gán quyền và theo dõi trạng thái người dùng toàn hệ thống"
            badge="UC06 • Admin User Management"
            actions={
                <button
                    type="button"
                    className={styles.btnActionPrimary}
                    onClick={() => setOpenCreateModal(true)}
                    title="Tạo tài khoản nhân sự mới"
                >
                    <Plus size={16} />
                    <span>Tạo tài khoản mới</span>
                </button>
            }
        >
            <AdminUserManagement
                onCreateModalOpen={openCreateModal}
                onResetCreateModalOpen={() => setOpenCreateModal(false)}
            />
        </AdminLayout>
    );
};

export default AdminUserManagementPage;

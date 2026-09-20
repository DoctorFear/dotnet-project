import React from 'react';
import AdminLayout from '../components/layout/admin/AdminLayout';
import AdminBookManagement from '../components/features/admin-books/AdminBookManagement';

export const AdminBookManagementPage: React.FC = () => {
    return (
        <AdminLayout
            activePage="books"
            title="Quản lý thông tin sách"
            subtitle="Kiểm soát thông tin đầu sách, thư viện ảnh, danh mục thể loại và nhà xuất bản"
            badge="Admin Book Management"
        >
            <AdminBookManagement />
        </AdminLayout>
    );
};

export default AdminBookManagementPage;

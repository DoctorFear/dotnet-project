import React from 'react';
import AdminLayout from '../components/layout/admin/AdminLayout';
import WarehouseManagement from '../components/features/staff-warehouse/WarehouseManagement';

export const WarehouseLogisticsPage: React.FC = () => {
    return (
        <AdminLayout
            activePage="warehouse"
            title="Quản lý Kho sách & Nhập hàng"
            subtitle="Quản trị Nhà cung cấp, Phiếu nhập kho, Cảnh báo tồn kho và Lịch sử biến động kho"
            badge="Warehouse Management"
        >
            <WarehouseManagement />
        </AdminLayout>
    );
};

export default WarehouseLogisticsPage;

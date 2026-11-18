import React from 'react';
import AdminLayout from '../components/layout/admin/AdminLayout';
import StaffShipperManagement from '../components/features/staff-shippers/StaffShipperManagement';

export const StaffShipperManagementPage: React.FC = () => {
    return (
        <AdminLayout
            activePage="shippers"
            title="Quản lý Đội ngũ Shipper"
            subtitle="Theo dõi nhân sự giao hàng, khu vực hoạt động, trạng thái ca và tải đơn nhận đồng thời"
            badge="Shipper Team Portal"
        >
            <StaffShipperManagement />
        </AdminLayout>
    );
};

export default StaffShipperManagementPage;

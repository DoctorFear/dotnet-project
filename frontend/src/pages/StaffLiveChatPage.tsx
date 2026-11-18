import React from 'react';
import { AdminLayout } from '../components/layout/admin/AdminLayout';
import { StaffChatConsole } from '../components/features/admin-chat/StaffChatConsole';

export const StaffLiveChatPage: React.FC = () => {
    return (
        <AdminLayout
            activePage="chat"
            title="Trung tâm hỗ trợ trực tuyến (Live Chat)"
            subtitle="Tiếp nhận hàng đợi, phản hồi khách hàng và quản trị chất lượng phục vụ (UC24)"
            badge="UC24"
        >
            <StaffChatConsole />
        </AdminLayout>
    );
};

export default StaffLiveChatPage;

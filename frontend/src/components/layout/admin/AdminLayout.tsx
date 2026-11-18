import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BarChart3,
    BookOpen,
    LogOut,
    MessageSquare,
    Package,
    Settings,
    Tags,
    UserCog,
    Warehouse,
    UserCircle,
    Award,
    FileText,
    Truck
} from 'lucide-react';
import styles from './AdminLayout.module.css';
import { useUser } from '../../../context/UserContext.tsx';
import { useAuthAction } from '../../../hooks/useAuthAction';
import { AdminProfileModal } from '../../features/profile/AdminProfileModal';

type AdminPageKey = 'books' | 'settings' | 'reports' | 'orders' | 'packing' | 'membership' | 'refunds' | 'users' | 'audit-logs' | 'warehouse' | 'shippers';

interface AdminLayoutProps {
    activePage: AdminPageKey;
    title: string;
    subtitle: string;
    badge: string;
    actions?: React.ReactNode;
    children: React.ReactNode;
}

const adminMenuItems = [
    { label: 'Thống kê & Báo cáo', icon: BarChart3, page: 'reports' as AdminPageKey, path: '/admin/reports' },
    { label: 'Quản lý & Phân quyền', icon: UserCog, page: 'users' as AdminPageKey, path: '/admin/users' },
    { label: 'Nhật ký hoạt động', icon: FileText, page: 'audit-logs' as AdminPageKey, path: '/admin/audit-logs' },
    { label: 'Quản lý sách', icon: BookOpen, page: 'books' as AdminPageKey, path: '/admin/books' },
    { label: 'Quản lý kho sách', icon: Warehouse, page: 'warehouse' as AdminPageKey, path: '/staff/warehouse' },
    { label: 'Đội ngũ Shipper', icon: Truck, page: 'shippers' as AdminPageKey, path: '/staff/shippers' },
    { label: 'Quản lý đơn hàng', icon: Package, page: 'orders' as AdminPageKey, path: '/admin/orders' },
    { label: 'Quản lý trả hàng', icon: Package, page: 'refunds' as AdminPageKey, path: '/admin/refunds' },
    { label: 'Tiếp nhận & Đóng gói', icon: Package, page: 'packing' as AdminPageKey, path: '/staff/packing' },
    { label: 'Live Chat Console', icon: MessageSquare },
    { label: 'Quản lý Khuyến mãi', icon: Tags },
    { label: 'Quản lý cài đặt', icon: Settings, page: 'settings' as AdminPageKey, path: '/admin/settings' },
    { label: 'Hạng thành viên', icon: Award, page: 'membership' as AdminPageKey, path: '/admin/membership-tiers' },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({
    activePage,
    title,
    subtitle,
    badge,
    actions,
    children,
}) => {
    const navigate = useNavigate();
    const { user } = useUser();
    const { handleLogout } = useAuthAction();

    // Quản lý trạng thái đóng/mở modal tài khoản Admin / Staff
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className={styles.adminShell}>
            <aside className={styles.adminSidebar}>
                <div className={styles.sidebarHeader}>
                    <button
                        type="button"
                        className={styles.brandName}
                        onClick={() => navigate(user?.role === 'Admin' ? '/admin/reports' : '/staff/books')}
                    >
                        ancient<span className={styles.bookText}>BOOK</span><span className={styles.accentDot}></span>
                    </button>
                    <div>
                        <span className={styles.adminBadge}>
                            {user?.role === 'Admin' ? 'Admin Portal' : 'Staff Portal'}
                        </span>
                    </div>
                </div>

                <ul className={styles.sidebarMenu}>
                    {adminMenuItems
                        .filter((item) =>
                            user?.role === 'Admin'
                                ? ['reports', 'settings', 'membership', 'users', 'audit-logs'].includes(item.page ?? '')
                                : !['reports', 'settings', 'users', 'audit-logs'].includes(item.page ?? '') && item.icon !== UserCog
                        )
                        .map((item) => {
                            const Icon = item.icon;
                            const isActive = item.page === activePage;
                            return (
                                <li className={styles.menuItem} key={item.label}>
                                    <button
                                        type="button"
                                        className={`${styles.menuLink} ${isActive ? styles.active : ''}`}
                                        onClick={() => item.path && navigate(item.path)}
                                    >
                                        <Icon />
                                        {item.label}
                                    </button>
                                </li>
                            );
                        })}
                </ul>

                <div className={styles.sidebarFooter}>
                    <div className={styles.userBadgeLeft}>
                        <img
                            src={
                                user?.avatarUrl ||
                                'https://media.istockphoto.com/id/2149922267/vector/user-icon.jpg?s=612x612&w=0&k=20&c=i6jYPfB1pWjK8pll6YRxAK9fgBmf65-w5wbKH9R1dyQ='
                            }
                            className={styles.userAvatarTiny}
                            alt="User Avatar"
                        />
                        <div className={styles.userInfo}>
                            <div className={styles.userName}>{user ? `@${user.username}` : '@admin'}</div>
                            <div className={styles.userRole}>
                                {user?.role === 'Admin' ? 'Quản trị viên' : user?.fullName || 'Quản trị viên'}
                            </div>
                        </div>
                    </div>

                    <div className={styles.footerActions}>
                        {/* Nút Chỉnh sửa tài khoản nằm bên trái nút Đăng xuất */}
                        <button
                            type="button"
                            className={styles.btnEditProfile}
                            title="Chỉnh sửa thông tin tài khoản"
                            onClick={() => setIsModalOpen(true)}
                        >
                            <UserCircle size={18} />
                        </button>

                        <button
                            type="button"
                            className={styles.btnLogout}
                            title="Đăng xuất khỏi hệ thống"
                            onClick={handleLogout}
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            <main className={styles.adminMain}>
                <header className={styles.adminTopbar}>
                    <div className={styles.topbarTitle}>
                        <h1>{title}</h1>
                        <span>{subtitle}</span>
                    </div>
                    <div className={styles.topbarActions}>
                        <span className={styles.badgeUc}>{badge}</span>
                        {actions}
                    </div>
                </header>
                <div className={styles.contentBody}>{children}</div>
            </main>

            {/* Modal chỉnh sửa tài khoản Admin/Staff được bóc tách dạng Modular Component */}
            <AdminProfileModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
};

export default AdminLayout;

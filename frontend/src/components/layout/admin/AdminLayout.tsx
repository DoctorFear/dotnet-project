import React from 'react';
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
} from 'lucide-react';
import styles from './AdminLayout.module.css';

type AdminPageKey = 'books' | 'settings';

interface AdminLayoutProps {
    activePage: AdminPageKey;
    title: string;
    subtitle: string;
    badge: string;
    children: React.ReactNode;
}

const adminMenuItems = [
    { label: 'Tổng quan', icon: BarChart3 },
    { label: 'Quản lý & Phân quyền', icon: UserCog },
    { label: 'Quản lý sách', icon: BookOpen, page: 'books' as AdminPageKey, path: '/admin/books' },
    { label: 'Quản lý kho sách', icon: Warehouse },
    { label: 'Quản lý đơn hàng', icon: Package },
    { label: 'Live Chat Console', icon: MessageSquare },
    { label: 'Quản lý Khuyến mãi', icon: Tags },
    { label: 'Quản lý cài đặt', icon: Settings, page: 'settings' as AdminPageKey, path: '/admin/settings' },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({
    activePage,
    title,
    subtitle,
    badge,
    children,
}) => {
    const navigate = useNavigate();

    return (
        <div className={styles.adminShell}>
            <aside className={styles.adminSidebar}>
                <div className={styles.sidebarHeader}>
                    <button type="button" className={styles.brandName} onClick={() => navigate('/admin/books')}>
                        ancient<span className={styles.bookText}>BOOK</span><span className={styles.accentDot}></span>
                    </button>
                    <div><span className={styles.adminBadge}>Admin Portal</span></div>
                </div>

                <ul className={styles.sidebarMenu}>
                    {adminMenuItems.map((item) => {
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
                            src="https://media.istockphoto.com/id/2149922267/vector/user-icon.jpg?s=612x612&w=0&k=20&c=i6jYPfB1pWjK8pll6YRxAK9fgBmf65-w5wbKH9R1dyQ="
                            className={styles.userAvatarTiny}
                            alt="User Avatar"
                        />
                        <div className={styles.userInfo}>
                            <div className={styles.userName}>@thaison_dev</div>
                            <div className={styles.userRole}>Quản trị viên</div>
                        </div>
                    </div>
                    <button type="button" className={styles.btnLogout} title="Đăng xuất khỏi hệ thống">
                        <LogOut />
                    </button>
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
                    </div>
                </header>
                <div className={styles.contentBody}>{children}</div>
            </main>
        </div>
    );
};

export default AdminLayout;

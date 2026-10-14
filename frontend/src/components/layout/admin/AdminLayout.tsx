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
    UserCircle
} from 'lucide-react';
import styles from './AdminLayout.module.css';
import { useUser } from '../../../context/UserContext.tsx';
import { useAuthAction } from '../../../hooks/useAuthAction';
import { useToastNotifications } from '../../../hooks/useToastNotifications';
import { ToastNotification } from '../../common/ToastNotification';
import { userService } from '../../../services/userService';

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
    const { user, updateUser } = useUser();
    const { handleLogout } = useAuthAction();
    const { toasts, notify, dismissToast } = useToastNotifications();

    // State Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        fullName: '',
        phoneNumber: '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });

    const handleOpenModal = async () => {
        setIsModalOpen(true);
        try {
            const res = await userService.getProfile();
            if (res.success && res.data) {
                setFormData({
                    username: res.data.username || user?.username || '',
                    email: res.data.email || user?.email || '',
                    fullName: res.data.fullName || user?.fullName || '',
                    phoneNumber: res.data.phoneNumber || '',
                    currentPassword: '',
                    newPassword: '',
                    confirmNewPassword: ''
                });
            }
        } catch {
            if (user) {
                setFormData({
                    username: user.username,
                    email: user.email,
                    fullName: user.fullName,
                    phoneNumber: '',
                    currentPassword: '',
                    newPassword: '',
                    confirmNewPassword: ''
                });
            }
        }
    };

    const handleCloseModal = () => {
        if (!isSubmitting) {
            setIsModalOpen(false);
        }
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmitProfile = async (e: React.FormEvent) => {
        e.preventDefault();

        const cleanFullName = formData.fullName.trim();
        const cleanEmail = formData.email.trim();
        const cleanPhone = formData.phoneNumber.trim();

        if (!cleanFullName) {
            notify('Họ và tên không được để trống.', 'error');
            return;
        }

        if (!cleanPhone) {
            notify('Số điện thoại không được để trống.', 'error');
            return;
        }

        const phoneRegex = /^0\d{9}$/;
        if (!phoneRegex.test(cleanPhone)) {
            notify('Số điện thoại phải gồm 10 chữ số (bắt đầu bằng 0).', 'error');
            return;
        }

        if (cleanEmail) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(cleanEmail)) {
                notify('Địa chỉ email không đúng định dạng.', 'error');
                return;
            }
        }

        const isChangingPassword = formData.currentPassword || formData.newPassword || formData.confirmNewPassword;
        if (isChangingPassword) {
            if (!formData.currentPassword) {
                notify('Vui lòng nhập mật khẩu hiện tại.', 'error');
                return;
            }
            if (formData.newPassword.length < 6) {
                notify('Mật khẩu mới phải có tối thiểu 6 ký tự.', 'error');
                return;
            }
            if (formData.newPassword !== formData.confirmNewPassword) {
                notify('Mật khẩu xác nhận không trùng khớp.', 'error');
                return;
            }
        }

        setIsSubmitting(true);
        try {
            // 1. Cập nhật hồ sơ
            const profileRes = await userService.updateProfile({
                fullName: cleanFullName,
                email: cleanEmail,
                phoneNumber: cleanPhone
            });

            if (!profileRes.success) {
                notify(profileRes.message || 'Cập nhật thông tin thất bại.', 'error');
                setIsSubmitting(false);
                return;
            }

            updateUser({ fullName: cleanFullName, email: cleanEmail });

            // 2. Cập nhật mật khẩu nếu có nhập
            if (isChangingPassword) {
                const passRes = await userService.changePassword({
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword,
                    confirmNewPassword: formData.confirmNewPassword
                });

                if (!passRes.success) {
                    notify(`Hồ sơ đã cập nhật nhưng đổi mật khẩu lỗi: ${passRes.message}`, 'error');
                    setIsSubmitting(false);
                    return;
                }
            }

            notify('Cập nhật thông tin tài khoản thành công!', 'success');
            setIsModalOpen(false);
        } catch (err: any) {
            notify(err.message || 'Lỗi kết nối máy chủ.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.adminShell}>
            <ToastNotification toasts={toasts} onClose={dismissToast} />

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
                            src={user?.avatarUrl || "https://media.istockphoto.com/id/2149922267/vector/user-icon.jpg?s=612x612&w=0&k=20&c=i6jYPfB1pWjK8pll6YRxAK9fgBmf65-w5wbKH9R1dyQ="}
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
                            onClick={handleOpenModal}
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
                    </div>
                </header>
                <div className={styles.contentBody}>{children}</div>
            </main>

            {/* MODAL CHỈNH SỬA TÀI KHOẢN ADMIN */}
            {isModalOpen && (
                <div className={styles.modalOverlay} onClick={handleCloseModal}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div>
                                <h3 className={styles.modalTitle}>Chỉnh sửa thông tin tài khoản</h3>
                                <p className={styles.modalSubtitle}>Cập nhật hồ sơ và mật khẩu bảo mật</p>
                            </div>
                            <button type="button" className={styles.btnCloseModal} onClick={handleCloseModal}>
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSubmitProfile} noValidate>
                            <div className={styles.modalBody}>
                                <div className={styles.formGrid}>
                                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                        <label>Tên đăng nhập (Đóng băng)</label>
                                        <input
                                            type="text"
                                            value={formData.username}
                                            readOnly
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Địa chỉ Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleFormChange}
                                            placeholder="admin@example.com"
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Họ và tên *</label>
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleFormChange}
                                            placeholder="Nhập họ và tên"
                                        />
                                    </div>

                                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                        <label>Số điện thoại *</label>
                                        <input
                                            type="tel"
                                            name="phoneNumber"
                                            value={formData.phoneNumber}
                                            onChange={handleFormChange}
                                            placeholder="10 số bắt đầu bằng 0 (ví dụ: 0912345678)"
                                            maxLength={10}
                                        />
                                    </div>

                                    <div className={styles.passwordDivider}>
                                        <div className={styles.passwordDividerTitle}>Đổi mật khẩu</div>
                                        <div className={styles.passwordDividerHint}>Để trống nếu không muốn thay đổi mật khẩu</div>
                                    </div>

                                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                        <label>Mật khẩu hiện tại</label>
                                        <input
                                            type="password"
                                            name="currentPassword"
                                            value={formData.currentPassword}
                                            onChange={handleFormChange}
                                            placeholder="Nhập mật khẩu hiện tại"
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Mật khẩu mới</label>
                                        <input
                                            type="password"
                                            name="newPassword"
                                            value={formData.newPassword}
                                            onChange={handleFormChange}
                                            placeholder="Tối thiểu 6 ký tự"
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Xác nhận mật khẩu mới</label>
                                        <input
                                            type="password"
                                            name="confirmNewPassword"
                                            value={formData.confirmNewPassword}
                                            onChange={handleFormChange}
                                            placeholder="Nhập lại mật khẩu mới"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={styles.modalFooter}>
                                <button
                                    type="button"
                                    className={styles.btnCancel}
                                    onClick={handleCloseModal}
                                    disabled={isSubmitting}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className={styles.btnSave}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLayout;
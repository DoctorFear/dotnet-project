import React, { useCallback, useEffect, useState } from 'react';
import styles from './AdminUser.module.css';
import { adminUserService } from '../../../services/adminUserService';
import { UserRoleEnum } from '../../../types/adminUser';
import type {
    CreateInternalUserRequestDto,
    UserFilterDto,
    UserManagementItemDto,
} from '../../../types/adminUser';
import { useUser } from '../../../context/UserContext';
import { useToastNotifications } from '../../../hooks/useToastNotifications';
import { ToastNotification } from '../../common/ToastNotification';
import { UserFilterBar } from './UserFilterBar';
import { UserTable } from './UserTable';
import { UserPagination } from './UserPagination';
import { CreateUserModal } from './CreateUserModal';
import { ChangeRoleModal } from './ChangeRoleModal';
import { ToggleStatusModal } from './ToggleStatusModal';

interface AdminUserManagementProps {
    onCreateModalOpen?: boolean;
    onResetCreateModalOpen?: () => void;
}

export const AdminUserManagement: React.FC<AdminUserManagementProps> = ({
    onCreateModalOpen = false,
    onResetCreateModalOpen,
}) => {
    const { user: currentUser } = useUser();
    const { toasts, notify, dismissToast } = useToastNotifications();

    // Dữ liệu danh sách & phân trang
    const [users, setUsers] = useState<UserManagementItemDto[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [pageNumber, setPageNumber] = useState(1);
    const pageSize = 10;
    const [loading, setLoading] = useState(false);

    // Bộ lọc
    const [keyword, setKeyword] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Modal state
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedUserForRole, setSelectedUserForRole] = useState<UserManagementItemDto | null>(null);
    const [selectedUserForStatus, setSelectedUserForStatus] = useState<UserManagementItemDto | null>(null);

    // Toast xanh góc dưới bên trái (Chuẩn theo Use Case UC06 & HTML mẫu)
    const [bottomToast, setBottomToast] = useState<{ show: boolean; text: string }>({
        show: false,
        text: '',
    });

    const showSuccessToast = useCallback((text: string) => {
        setBottomToast({ show: true, text });
        const timer = setTimeout(() => {
            setBottomToast((prev) => ({ ...prev, show: false }));
        }, 3500);
        return () => clearTimeout(timer);
    }, []);

    // Nhận diện SuperAdmin hiện tại từ danh sách users
    const currentAdminItem = users.find(
        (u) =>
            u.id === currentUser?.id ||
            (currentUser?.username && u.username.toLowerCase() === currentUser.username.toLowerCase())
    );
    const isCurrentAdminSuper = currentAdminItem?.isSuperAdmin ?? false;

    // Đồng bộ nếu prop bên ngoài muốn mở modal tạo
    useEffect(() => {
        if (onCreateModalOpen) {
            setIsCreateOpen(true);
            onResetCreateModalOpen?.();
        }
    }, [onCreateModalOpen, onResetCreateModalOpen]);

    // Gọi API nạp dữ liệu
    const loadUsers = useCallback(async () => {
        try {
            setLoading(true);
            const filter: UserFilterDto = {
                keyword: keyword.trim() || undefined,
                role: (roleFilter as unknown as UserRoleEnum) || undefined,
                isActive: statusFilter === '' ? undefined : statusFilter === 'true',
                pageNumber,
                pageSize,
            };

            const res = await adminUserService.getUsers(filter);
            if (res.data) {
                setUsers(res.data.items);
                setTotalItems(res.data.totalCount);
                setTotalPages(res.data.totalPages);
            }
        } catch (err: unknown) {
            const error = err as { message?: string };
            notify(error?.message || 'Không thể tải danh sách tài khoản', 'error');
        } finally {
            setLoading(false);
        }
    }, [keyword, roleFilter, statusFilter, pageNumber, pageSize, notify]);

    // Load lại khi filter hoặc page thay đổi
    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    // Khi filter đổi -> reset về page 1 (A1: reset về trang 1 và hiển thị kết quả)
    const handleKeywordChange = useCallback((newKw: string) => {
        setKeyword(newKw);
        setPageNumber(1);
    }, []);

    const handleRoleChange = useCallback((newRole: string) => {
        setRoleFilter(newRole);
        setPageNumber(1);
    }, []);

    const handleStatusChange = useCallback((newStatus: string) => {
        setStatusFilter(newStatus);
        setPageNumber(1);
    }, []);

    // Xử lý tạo mới (A2: Đưa lên đầu bảng danh sách và hiển thị thông báo màu xanh góc dưới bên trái)
    const handleCreateUser = async (
        data: CreateInternalUserRequestDto
    ): Promise<{ success: boolean; message?: string }> => {
        try {
            await adminUserService.createInternalUser(data);
            const roleLabel =
                data.role === UserRoleEnum.Admin
                    ? 'Quản trị viên'
                    : data.role === UserRoleEnum.Shipper
                    ? 'Nhân viên giao hàng'
                    : 'Nhân viên hệ thống';
            showSuccessToast(`Đã tạo thành công tài khoản @${data.username} (${roleLabel})`);
            setPageNumber(1);
            await loadUsers();
            return { success: true };
        } catch (err: unknown) {
            const error = err as { message?: string };
            return { success: false, message: error?.message || 'Có lỗi khi tạo tài khoản' };
        }
    };

    // Xử lý đổi vai trò (Main Flow 8: Hiển thị toast màu xanh góc dưới bên trái: "Đã chuyển @username sang vai trò: [Tên vai trò]")
    const handleChangeRole = async (
        userId: number,
        newRole: UserRoleEnum
    ): Promise<{ success: boolean; message?: string }> => {
        try {
            await adminUserService.updateRole(userId, { newRole });
            const target = users.find((u) => u.id === userId);
            const username = target ? target.username : `ID:${userId}`;
            const roleLabel =
                newRole === UserRoleEnum.Admin
                    ? 'Quản trị viên'
                    : newRole === UserRoleEnum.Shipper
                    ? 'Nhân viên giao hàng'
                    : 'Nhân viên hệ thống';
            showSuccessToast(`Đã chuyển @${username} sang vai trò: ${roleLabel}`);
            await loadUsers();
            return { success: true };
        } catch (err: unknown) {
            const error = err as { message?: string };
            return { success: false, message: error?.message || 'Có lỗi khi đổi vai trò' };
        }
    };

    // Xử lý khóa / mở khóa (A3: Hiển thị màu xanh góc dưới bên trái)
    const handleToggleStatus = async (userId: number, newStatus: boolean) => {
        try {
            await adminUserService.toggleStatus(userId, { isActive: newStatus });
            const target = users.find((u) => u.id === userId);
            const username = target ? target.username : `ID: ${userId}`;
            if (newStatus) {
                showSuccessToast(`Đã mở khóa tài khoản @${username}!`);
            } else {
                showSuccessToast(`Đã khóa tài khoản @${username}!`);
            }
            await loadUsers();
        } catch (err: unknown) {
            const error = err as { message?: string };
            notify(error?.message || 'Có lỗi xảy ra khi cập nhật trạng thái', 'error');
        }
    };

    return (
        <section className={styles.tablePanel}>
            {/* Thanh tìm kiếm & lọc */}
            <UserFilterBar
                keyword={keyword}
                role={roleFilter}
                isActive={statusFilter}
                onKeywordChange={handleKeywordChange}
                onRoleChange={handleRoleChange}
                onStatusChange={handleStatusChange}
                onCreateUserClick={() => setIsCreateOpen(true)}
            />

            {/* Bảng danh sách người dùng */}
            <UserTable
                users={users}
                isLoading={loading}
                currentAdminUsername={currentUser?.username}
                isCurrentAdminSuper={isCurrentAdminSuper}
                onEditRole={(u) => setSelectedUserForRole(u)}
                onToggleStatus={(u) => setSelectedUserForStatus(u)}
            />

            {/* Phân trang */}
            <UserPagination
                pageNumber={pageNumber}
                pageSize={pageSize}
                totalItems={totalItems}
                totalPages={totalPages}
                onPageChange={(p) => setPageNumber(p)}
            />

            {/* Modal tạo tài khoản */}
            <CreateUserModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSubmit={handleCreateUser}
            />

            {/* Modal phân vai trò */}
            <ChangeRoleModal
                isOpen={!!selectedUserForRole}
                user={selectedUserForRole}
                onClose={() => setSelectedUserForRole(null)}
                onSubmit={handleChangeRole}
            />

            {/* Modal khóa / mở khóa */}
            <ToggleStatusModal
                isOpen={!!selectedUserForStatus}
                user={selectedUserForStatus}
                onClose={() => setSelectedUserForStatus(null)}
                onConfirm={handleToggleStatus}
            />

            {/* Toast thông báo lỗi / hệ thống chung góc trên */}
            <ToastNotification toasts={toasts} onClose={dismissToast} />

            {/* TOAST THÀNH CÔNG MÀU XANH GÓC DƯỚI BÊN TRÁI (Chuẩn theo Use Case UC06) */}
            <div
                className={`${styles.toastSuccessBottom} ${
                    bottomToast.show ? styles.show : ''
                }`}
                role="alert"
                aria-live="polite"
            >
                <div className={styles.toastIconWrap}>
                    <svg
                        viewBox="0 0 16 16"
                        fill="none"
                        style={{ width: 12, height: 12 }}
                    >
                        <path
                            d="M3 8.5L6.5 12L13 4.5"
                            stroke="#ffffff"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
                <span>{bottomToast.text}</span>
            </div>
        </section>
    );
};

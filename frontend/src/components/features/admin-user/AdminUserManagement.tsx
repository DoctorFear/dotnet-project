import React from 'react';
import { Plus, Search } from 'lucide-react';
import { ROLE_META, useAdminUserManagement } from '../../../hooks/useAdminManagement';
import type { UserRoleType } from '../../../types/adminUser';
import BookPagination from '../../common/BookPagination';
import ToastNotification from '../../common/ToastNotification';
import AdminUserModals from './AdminUserModals';
import styles from './AdminUserManagement.module.css';

const getInitials = (fullName: string) =>
    fullName
        .trim()
        .split(/\s+/)
        .map((part) => part[0])
        .slice(-2)
        .join('')
        .toUpperCase() || 'U';

const roleBadgeClass = (role: UserRoleType) => {
    switch (role) {
        case 'Admin':
            return styles.roleAdmin;
        case 'Staff':
            return styles.roleStaff;
        case 'Shipper':
            return styles.roleShipper;
        default:
            return styles.roleCustomer;
    }
};

export const AdminUserManagement: React.FC = () => {
    const controller = useAdminUserManagement();
    const {
        users,
        totalCount,
        currentPage,
        pageSize,
        searchText,
        roleFilter,
        statusFilter,
        isLoading,
        error,
        toasts,
        removeToast,
        setCurrentPage,
        setPageSize,
        setSearchText,
        setRoleFilter,
        setStatusFilter,
        getRowPermissions,
        openCreateModal,
        openRoleModal,
        openStatusModal,
    } = controller;

    return (
        <>
            <ToastNotification toasts={toasts} onClose={removeToast} />

            <section className={styles.tablePanel}>
                <div className={styles.panelHeader}>
                    <div className={styles.searchWrap}>
                        <Search size={16} className={styles.searchIcon} />
                        <input
                            type="text"
                            className={styles.searchInput}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            placeholder="Tìm theo tên, username, email..."
                        />
                    </div>

                    <div className={styles.filterGroup}>
                        <select
                            aria-label="Lọc theo vai trò"
                            className={styles.filterSelect}
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value as UserRoleType | '')}
                        >
                            <option value="">Tất cả vai trò</option>
                            <option value="Admin">Quản trị viên (Admin)</option>
                            <option value="Staff">Nhân viên hệ thống</option>
                            <option value="Shipper">Nhân viên giao hàng</option>
                            <option value="Member">Khách hàng thành viên</option>
                        </select>

                        <select
                            aria-label="Lọc theo trạng thái"
                            className={styles.filterSelect}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as '' | 'active' | 'locked')}
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="active">Đang hoạt động</option>
                            <option value="locked">Bị khóa</option>
                        </select>

                        <button type="button" className={styles.btnActionPrimary} onClick={openCreateModal}>
                            <Plus size={16} />
                            Tạo tài khoản mới
                        </button>
                    </div>
                </div>

                {error && <div className={styles.errorBanner}>{error}</div>}

                <div className={styles.tableScroll}>
                    <table className={styles.dataTable}>
                        <thead>
                            <tr>
                                <th>Người dùng</th>
                                <th>Email</th>
                                <th>Số điện thoại</th>
                                <th>Vai trò (1 Role)</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr className={styles.emptyRow}>
                                    <td colSpan={6}>Đang tải danh sách tài khoản...</td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr className={styles.emptyRow}>
                                    <td colSpan={6}>Không tìm thấy tài khoản phù hợp với bộ lọc hiện tại</td>
                                </tr>
                            ) : (
                                users.map((u) => {
                                    const { isSelf, isSuper, editDisabled, editTitle, lockDisabled, lockTitle } =
                                        getRowPermissions(u);
                                    const roleLabel =
                                        u.role === 'Admin' && isSuper
                                            ? 'Super Admin'
                                            : ROLE_META[u.role]?.label ?? u.role;

                                    return (
                                        <tr key={u.id}>
                                            <td>
                                                <div className={styles.userCell}>
                                                    <div className={styles.avatarSmall}>{getInitials(u.fullName)}</div>
                                                    <div className={styles.userCellMeta}>
                                                        <span className={styles.userFullname}>
                                                            {u.fullName}{' '}
                                                            {isSuper && (
                                                                <span className={styles.superStar} title="Super Admin">
                                                                    ★
                                                                </span>
                                                            )}
                                                        </span>
                                                        <span className={styles.userUsername}>
                                                            @{u.username}
                                                            {isSelf ? ' (Bạn)' : ''}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{u.email}</td>
                                            <td>{u.phoneNumber || '—'}</td>
                                            <td>
                                                <span className={`${styles.badgeRole} ${roleBadgeClass(u.role)}`}>
                                                    {roleLabel}
                                                </span>
                                            </td>
                                            <td>
                                                <span
                                                    className={`${styles.statusBadge} ${
                                                        u.isActive ? styles.statusActive : styles.statusLocked
                                                    }`}
                                                >
                                                    <span className={styles.statusDot} />
                                                    {u.isActive ? 'Hoạt động' : 'Đang bị khóa'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className={styles.actionBtns}>
                                                    <button
                                                        type="button"
                                                        className={styles.btnTableEdit}
                                                        disabled={editDisabled}
                                                        title={editTitle}
                                                        onClick={() => openRoleModal(u)}
                                                    >
                                                        Phân vai trò
                                                    </button>

                                                    {u.isActive ? (
                                                        <button
                                                            type="button"
                                                            className={styles.btnTableLock}
                                                            disabled={lockDisabled}
                                                            title={lockTitle}
                                                            onClick={() => openStatusModal(u)}
                                                        >
                                                            Khóa
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className={styles.btnTableUnlock}
                                                            onClick={() => openStatusModal(u)}
                                                        >
                                                            Mở khóa
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <BookPagination
                    variant="admin"
                    page={currentPage}
                    pageSize={pageSize}
                    totalCount={totalCount}
                    pageSizes={[5, 10, 20, 50, 100]}
                    itemLabel="tài khoản"
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(size) => {
                        setPageSize(size);
                        setCurrentPage(1);
                    }}
                />
            </section>

            <AdminUserModals controller={controller} />
        </>
    );
};

export default AdminUserManagement;
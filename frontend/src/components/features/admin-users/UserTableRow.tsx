import React from 'react';
import type { UserManagementItemDto } from '../../../types/adminUser';
import styles from './AdminUser.module.css';

interface UserTableRowProps {
    user: UserManagementItemDto;
    currentAdminUsername?: string;
    isCurrentAdminSuper?: boolean;
    onEditRole: (user: UserManagementItemDto) => void;
    onToggleStatus: (user: UserManagementItemDto) => void;
}

const getInitials = (fullName: string): string => {
    if (!fullName) return 'U';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getRoleBadgeClass = (role: string): string => {
    switch (role.toLowerCase()) {
        case 'admin':
            return styles.roleAdmin;
        case 'staff':
            return styles.roleStaff;
        case 'shipper':
            return styles.roleShipper;
        default:
            return styles.roleCustomer;
    }
};

const getRoleDisplayName = (role: string): string => {
    switch (role.toLowerCase()) {
        case 'admin':
            return 'Quản trị viên';
        case 'staff':
            return 'Nhân viên hệ thống';
        case 'shipper':
            return 'Nhân viên giao hàng';
        case 'member':
            return 'Khách hàng thành viên';
        default:
            return role;
    }
};

export const UserTableRow: React.FC<UserTableRowProps> = ({
    user,
    currentAdminUsername,
    isCurrentAdminSuper = false,
    onEditRole,
    onToggleStatus,
}) => {
    const isMe = !!currentAdminUsername && user.username.toLowerCase() === currentAdminUsername.toLowerCase();
    const isSuperAdmin = user.isSuperAdmin;
    const isMember = user.role.toLowerCase() === 'member';
    const isTargetAdmin = user.role.toLowerCase() === 'admin';

    // E3: Nếu Admin thường cố gắng phân vai trò của Admin khác -> Khóa xám
    const cannotEditAdminOther = isTargetAdmin && !isMe && !isCurrentAdminSuper;

    const roleDisabled = isMe || isSuperAdmin || isMember || cannotEditAdminOther;

    let roleTitle = 'Phân vai trò nội bộ';
    if (isMe) {
        roleTitle = 'Không thể tự đổi vai trò của chính mình';
    } else if (isSuperAdmin) {
        roleTitle = 'Tài khoản Super Admin là bất khả xâm phạm';
    } else if (isMember) {
        roleTitle = 'Khách hàng thành viên không được phép phân quyền nhân sự';
    } else if (cannotEditAdminOther) {
        roleTitle = 'Chỉ Super Admin mới có quyền đổi vai trò của Quản trị viên khác';
    }

    const lockDisabled = isMe || isSuperAdmin;
    let lockTitle = user.isActive ? 'Khóa tài khoản này' : 'Mở khóa tài khoản này';
    if (isMe) {
        lockTitle = 'Không thể tự khóa tài khoản của chính mình';
    } else if (isSuperAdmin) {
        lockTitle = 'Không thể khóa Super Admin';
    }

    return (
        <tr>
            {/* Cột 1: Người dùng (Avatar, Họ tên, Username, Tag Bạn/SuperAdmin) */}
            <td>
                <div className={styles.userCell}>
                    <div className={styles.avatarSmall}>
                        {getInitials(user.fullName)}
                    </div>
                    <div className={styles.userCellMeta}>
                        <div className={styles.userFullName}>
                            <span>{user.fullName || user.username}</span>
                            {isMe && <span className={styles.badgeYou}>Bạn</span>}
                            {isSuperAdmin && <span className={styles.badgeSuper}>★ Super Admin</span>}
                        </div>
                        <span className={styles.userUsername}>@{user.username}</span>
                    </div>
                </div>
            </td>

            {/* Cột 2: Email */}
            <td>{user.email || '—'}</td>

            {/* Cột 3: Số điện thoại */}
            <td>{user.phoneNumber || '—'}</td>

            {/* Cột 4: Vai trò */}
            <td>
                <span className={`${styles.badgeRole} ${getRoleBadgeClass(user.role)}`}>
                    {getRoleDisplayName(user.role)}
                </span>
            </td>

            {/* Cột 5: Trạng thái */}
            <td>
                <span
                    className={`${styles.statusBadge} ${
                        user.isActive ? styles.statusActive : styles.statusLocked
                    }`}
                >
                    <span className={styles.statusDot}></span>
                    {user.isActive ? 'Đang hoạt động' : 'Bị khóa'}
                </span>
            </td>

            {/* Cột 6: Hành động */}
            <td>
                <div className={styles.actionBtns}>
                    <button
                        type="button"
                        className={styles.btnTableEdit}
                        disabled={roleDisabled}
                        title={roleTitle}
                        onClick={() => onEditRole(user)}
                    >
                        Phân vai trò
                    </button>

                    {user.isActive ? (
                        <button
                            type="button"
                            className={styles.btnTableLock}
                            disabled={lockDisabled}
                            title={lockTitle}
                            onClick={() => onToggleStatus(user)}
                        >
                            Khóa
                        </button>
                    ) : (
                        <button
                            type="button"
                            className={styles.btnTableUnlock}
                            disabled={lockDisabled}
                            title={lockTitle}
                            onClick={() => onToggleStatus(user)}
                        >
                            Mở khóa
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default UserTableRow;

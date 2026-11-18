import React from 'react';
import type { UserManagementItemDto } from '../../../types/adminUser';
import { UserTableRow } from './UserTableRow';
import styles from './AdminUser.module.css';

interface UserTableProps {
    users: UserManagementItemDto[];
    isLoading: boolean;
    currentAdminUsername?: string;
    isCurrentAdminSuper?: boolean;
    onEditRole: (user: UserManagementItemDto) => void;
    onToggleStatus: (user: UserManagementItemDto) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
    users,
    isLoading,
    currentAdminUsername,
    isCurrentAdminSuper = false,
    onEditRole,
    onToggleStatus,
}) => {
    return (
        <div className={styles.tableResponsive}>
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
                            <td colSpan={6}>Đang tải danh sách người dùng...</td>
                        </tr>
                    ) : users.length === 0 ? (
                        <tr className={styles.emptyRow}>
                            <td colSpan={6}>Không tìm thấy tài khoản nào phù hợp với bộ lọc.</td>
                        </tr>
                    ) : (
                        users.map((user) => (
                            <UserTableRow
                                key={user.id}
                                user={user}
                                currentAdminUsername={currentAdminUsername}
                                isCurrentAdminSuper={isCurrentAdminSuper}
                                onEditRole={onEditRole}
                                onToggleStatus={onToggleStatus}
                            />
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default UserTable;

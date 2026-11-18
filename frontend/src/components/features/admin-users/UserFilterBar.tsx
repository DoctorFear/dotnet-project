import React, { useEffect, useState } from 'react';
import { Search, Plus } from 'lucide-react';
import styles from './AdminUser.module.css';
import { UserRoleEnum } from '../../../types/adminUser';

interface UserFilterBarProps {
    keyword: string;
    role: string;
    isActive: string;
    onKeywordChange: (keyword: string) => void;
    onRoleChange: (role: string) => void;
    onStatusChange: (status: string) => void;
    onCreateUserClick?: () => void;
}

export const UserFilterBar: React.FC<UserFilterBarProps> = ({
    keyword,
    role,
    isActive,
    onKeywordChange,
    onRoleChange,
    onStatusChange,
    onCreateUserClick,
}) => {
    const [searchTerm, setSearchTerm] = useState(keyword);

    // Debounce tìm kiếm 300ms
    useEffect(() => {
        const timer = setTimeout(() => {
            onKeywordChange(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, onKeywordChange]);

    return (
        <div className={styles.panelHeader}>
            <div className={styles.searchWrap}>
                <Search size={16} className={styles.searchIcon} />
                <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Tìm tên, email, username..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className={styles.filterGroup}>
                <select
                    className={styles.filterSelect}
                    value={role}
                    onChange={(e) => onRoleChange(e.target.value)}
                    aria-label="Lọc theo vai trò"
                >
                    <option value="">Tất cả vai trò</option>
                    <option value={UserRoleEnum.Admin}>Quản trị viên</option>
                    <option value={UserRoleEnum.Staff}>Nhân viên</option>
                    <option value={UserRoleEnum.Shipper}>Nhân viên giao hàng</option>
                    <option value={UserRoleEnum.Member}>Khách hàng</option>
                </select>

                <select
                    className={styles.filterSelect}
                    value={isActive}
                    onChange={(e) => onStatusChange(e.target.value)}
                    aria-label="Lọc theo trạng thái"
                >
                    <option value="">Tất cả trạng thái</option>
                    <option value="true">Đang hoạt động</option>
                    <option value="false">Bị khóa</option>
                </select>

                {onCreateUserClick && (
                    <button
                        type="button"
                        className={styles.btnActionPrimary}
                        onClick={onCreateUserClick}
                        title="Tạo tài khoản nhân sự mới"
                    >
                        <Plus size={16} />
                        <span>Tạo tài khoản mới</span>
                    </button>
                )}
            </div>
        </div>
    );
};

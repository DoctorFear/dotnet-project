import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import styles from './AuditLog.module.css';

interface AuditLogFilterBarProps {
    keyword: string;
    module: string;
    role: string;
    fromDate: string;
    toDate: string;
    onKeywordChange: (keyword: string) => void;
    onModuleChange: (module: string) => void;
    onRoleChange: (role: string) => void;
    onFromDateChange: (date: string) => void;
    onToDateChange: (date: string) => void;
}

export const AuditLogFilterBar: React.FC<AuditLogFilterBarProps> = ({
    keyword,
    module,
    role,
    fromDate,
    toDate,
    onKeywordChange,
    onModuleChange,
    onRoleChange,
    onFromDateChange,
    onToDateChange,
}) => {
    const [searchTerm, setSearchTerm] = useState(keyword);

    // Đồng bộ khi keyword ngoài bị reset
    useEffect(() => {
        setSearchTerm(keyword);
    }, [keyword]);

    // Debounce tìm kiếm 300ms
    useEffect(() => {
        const timer = setTimeout(() => {
            onKeywordChange(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, onKeywordChange]);

    return (
        <div className={styles.panelHeader}>
            <div className={styles.filterRowPrimary}>
                {/* Ô TÌM KIẾM */}
                <div className={styles.searchWrap}>
                    <Search size={16} className={styles.searchIcon} />
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Tìm theo Email, Mã đối tượng, Hành động..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* BỘ LỌC ĐA CHIỀU: VAI TRÒ, NGHIỆP VỤ & THỜI GIAN */}
                <div className={styles.filterGroupWrap}>
                    {/* Lọc Vai trò */}
                    <select
                        className={styles.filterSelect}
                        value={role}
                        onChange={(e) => onRoleChange(e.target.value)}
                        aria-label="Lọc theo vai trò"
                    >
                        <option value="">Tất cả vai trò</option>
                        <option value="Admin">Admin</option>
                        <option value="Staff">Nhân viên (Staff)</option>
                        <option value="Shipper">Giao hàng (Shipper)</option>
                        <option value="Customer">Khách hàng</option>
                        <option value="System">Hệ thống</option>
                    </select>

                    {/* Lọc Nhóm nghiệp vụ */}
                    <select
                        className={styles.filterSelect}
                        value={module}
                        onChange={(e) => onModuleChange(e.target.value)}
                        aria-label="Lọc theo nhóm nghiệp vụ"
                    >
                        <option value="">Tất cả nghiệp vụ</option>
                        <option value="AUTH">Bảo mật & Tài khoản</option>
                        <option value="SETTING">Cài đặt hệ thống</option>
                        <option value="INVENTORY">Kho hàng & Sách</option>
                        <option value="ORDER">Đơn hàng & Giao vận</option>
                    </select>

                    {/* Lọc Khoảng thời gian */}
                    <div className={styles.filterDateGroup}>
                        <span>Từ:</span>
                        <input
                            type="date"
                            className={styles.filterDateInput}
                            value={fromDate}
                            onChange={(e) => onFromDateChange(e.target.value)}
                            title="Từ ngày"
                        />
                        <span>Đến:</span>
                        <input
                            type="date"
                            className={styles.filterDateInput}
                            value={toDate}
                            onChange={(e) => onToDateChange(e.target.value)}
                            title="Đến ngày"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuditLogFilterBar;

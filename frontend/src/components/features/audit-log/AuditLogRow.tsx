import React from 'react';
import type { AuditLogItemDto } from '../../../types/auditLog';
import styles from './AuditLog.module.css';

interface AuditLogRowProps {
    log: AuditLogItemDto;
}

// Chuyển đổi tên thực thể sang tiếng Việt thân thiện
const getEntityDisplayName = (entityName: string): string => {
    switch (entityName.toLowerCase()) {
        case 'users':
        case 'user':
            return 'Người dùng';
        case 'books':
        case 'book':
            return 'Sách';
        case 'orders':
        case 'order':
            return 'Đơn hàng';
        case 'categories':
        case 'category':
            return 'Danh mục';
        case 'publishers':
        case 'publisher':
            return 'Nhà xuất bản';
        case 'suppliers':
        case 'supplier':
            return 'Nhà cung cấp';
        case 'inventory':
        case 'warehouse':
            return 'Tồn kho';
        case 'settings':
        case 'setting':
            return 'Cài đặt';
        case 'fpoints':
        case 'pointwallet':
            return 'Ví điểm';
        case 'sessions':
        case 'session':
            return 'Phiên làm việc';
        default:
            return entityName;
    }
};

// Format giá trị hiển thị Trước / Sau
const renderValue = (val: string | null | undefined, isOld: boolean) => {
    if (!val || val.trim() === '' || val === 'null' || val === '—') {
        return <span className={styles.valEmpty}>—</span>;
    }

    if (val === '***' || val.includes('******')) {
        return <span className={styles.valSecurity}>***</span>;
    }

    // Nếu là JSON chuỗi dạng {"Role":"Staff"} -> hiển thị sạch đẹp
    if (val.startsWith('{') && val.endsWith('}')) {
        try {
            const parsed = JSON.parse(val);
            const entries = Object.entries(parsed);
            if (entries.length > 0) {
                const text = entries.map(([k, v]) => `${k}: ${v}`).join(', ');
                return (
                    <span
                        className={isOld ? styles.valOld : styles.valNew}
                        title={text}
                    >
                        {text}
                    </span>
                );
            }
        } catch {
            // Không parse được thì hiển thị bình thường
        }
    }

    return (
        <span
            className={isOld ? styles.valOld : styles.valNew}
            title={val}
        >
            {val}
        </span>
    );
};

export const AuditLogRow: React.FC<AuditLogRowProps> = ({ log }) => {
    // Tách ngày và giờ từ Timestamp ISO (hoặc yyyy-MM-dd HH:mm:ss)
    const formatTimestamp = (ts: string) => {
        try {
            const d = new Date(ts);
            if (!isNaN(d.getTime())) {
                const time = d.toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                });
                const date = d.toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                });
                return { time, date };
            }
        } catch {
            // Fallback nếu chuỗi không parse được chuẩn
        }
        const parts = ts.split('T');
        if (parts.length === 2) {
            return { time: parts[1].split('.')[0], date: parts[0] };
        }
        return { time: ts, date: '' };
    };

    const { time, date } = formatTimestamp(log.timestamp);

    return (
        <tr>
            {/* Cột 1: Thời gian */}
            <td>
                <div className={styles.timeCell}>{time}</div>
                {date && <span className={styles.timeSub}>{date}</span>}
            </td>

            {/* Cột 2: Người thực hiện */}
            <td>
                <div className={styles.actorCell}>
                    <span className={styles.actorEmail}>
                        {log.performerEmail || log.performerUsername || 'Hệ thống'}
                    </span>
                    <span className={styles.actorRoleTag}>
                        {log.performerRole || 'System'}
                    </span>
                </div>
            </td>

            {/* Cột 3: Hành động */}
            <td>
                <span className={styles.badgeActionUnified} title={log.details || log.action}>
                    {log.details || log.action}
                </span>
            </td>

            {/* Cột 4: Tác động đến */}
            <td>
                <div className={styles.targetCell}>
                    <span className={styles.targetTableVn}>
                        {getEntityDisplayName(log.entityName)}
                    </span>
                    {log.recordId && (
                        <span className={styles.targetIdVn}>
                            {log.recordId}
                        </span>
                    )}
                </div>
            </td>

            {/* Cột 5: Trước cập nhật */}
            <td>{renderValue(log.oldValues, true)}</td>

            {/* Cột 6: Sau cập nhật */}
            <td>{renderValue(log.newValues, false)}</td>

            {/* Cột 7: Địa chỉ IP */}
            <td>
                <span className={styles.ipBadge}>
                    {log.ipAddress || '127.0.0.1'}
                </span>
            </td>
        </tr>
    );
};

export default AuditLogRow;

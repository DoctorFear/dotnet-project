import React from 'react';
import type { AuditLogItemDto } from '../../../types/auditLog';
import { AuditLogRow } from './AuditLogRow';
import styles from './AuditLog.module.css';

interface AuditLogTableProps {
    logs: AuditLogItemDto[];
    isLoading: boolean;
}

export const AuditLogTable: React.FC<AuditLogTableProps> = ({ logs, isLoading }) => {
    return (
        <div className={styles.tableResponsive}>
            <table className={styles.dataTable}>
                <thead>
                    <tr>
                        <th style={{ width: '13%' }}>Thời gian</th>
                        <th style={{ width: '17%' }}>Người thực hiện</th>
                        <th style={{ width: '16%' }}>Hành động</th>
                        <th style={{ width: '14%' }}>Tác động đến</th>
                        <th style={{ width: '14%' }}>Trước cập nhật</th>
                        <th style={{ width: '14%' }}>Sau cập nhật</th>
                        <th style={{ width: '12%' }}>Địa chỉ IP</th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading ? (
                        <tr className={styles.emptyRow}>
                            <td colSpan={7}>Đang tải danh sách nhật ký kiểm toán...</td>
                        </tr>
                    ) : logs.length === 0 ? (
                        <tr className={styles.emptyRow}>
                            <td colSpan={7}>Không có nhật ký nào phù hợp với bộ lọc.</td>
                        </tr>
                    ) : (
                        logs.map((log) => <AuditLogRow key={log.id} log={log} />)
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default AuditLogTable;

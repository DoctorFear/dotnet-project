import React, { useCallback, useEffect, useState } from 'react';
import styles from './AuditLog.module.css';
import { auditLogService } from '../../../services/auditLogService';
import type { AuditLogFilterDto, AuditLogItemDto } from '../../../types/auditLog';
import { AuditLogFilterBar } from './AuditLogFilterBar';
import { AuditLogTable } from './AuditLogTable';
import { AuditLogPagination } from './AuditLogPagination';

interface AuditLogManagementProps {
    onResetRef?: (resetFn: () => void) => void;
}

export const AuditLogManagement: React.FC<AuditLogManagementProps> = ({ onResetRef }) => {
    // Dữ liệu danh sách & phân trang
    const [logs, setLogs] = useState<AuditLogItemDto[]>([]);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const pageSize = 12;
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Bộ lọc đa chiều
    const [keyword, setKeyword] = useState<string>('');
    const [module, setModule] = useState<string>('');
    const [role, setRole] = useState<string>('');
    const [fromDate, setFromDate] = useState<string>('');
    const [toDate, setToDate] = useState<string>('');

    // Nạp dữ liệu từ API
    const loadLogs = useCallback(async () => {
        try {
            setIsLoading(true);
            const filter: AuditLogFilterDto = {
                keyword: keyword.trim() || undefined,
                module: module || undefined,
                fromDate: fromDate || undefined,
                toDate: toDate || undefined,
                pageNumber,
                pageSize,
            };

            const res = await auditLogService.getAuditLogs(filter);
            if (res.data) {
                let items = res.data.items || [];
                // Lọc client-side theo role nếu người dùng chọn role
                if (role) {
                    items = items.filter(
                        (i) => i.performerRole.toLowerCase() === role.toLowerCase()
                    );
                }
                setLogs(items);
                setTotalCount(res.data.totalCount);
                setTotalPages(res.data.totalPages || 1);
            } else {
                setLogs([]);
                setTotalCount(0);
                setTotalPages(1);
            }
        } catch (err) {
            console.error('Không thể nạp nhật ký kiểm toán:', err);
            setLogs([]);
            setTotalCount(0);
            setTotalPages(1);
        } finally {
            setIsLoading(false);
        }
    }, [keyword, module, role, fromDate, toDate, pageNumber, pageSize]);

    useEffect(() => {
        loadLogs();
    }, [loadLogs]);

    // Đưa toàn bộ bộ lọc về mặc định (Main Flow 9 & 10)
    const resetFilters = useCallback(() => {
        setKeyword('');
        setModule('');
        setRole('');
        setFromDate('');
        setToDate('');
        setPageNumber(1);
    }, []);

    // Đăng ký hàm reset cho cha (nếu nút Làm mới ở Topbar)
    useEffect(() => {
        if (onResetRef) {
            onResetRef(resetFilters);
        }
    }, [onResetRef, resetFilters]);

    // Handlers đổi bộ lọc (reset về trang 1 theo yêu cầu Bước 4)
    const handleKeywordChange = useCallback((newKw: string) => {
        setKeyword(newKw);
        setPageNumber(1);
    }, []);

    const handleModuleChange = useCallback((newMod: string) => {
        setModule(newMod);
        setPageNumber(1);
    }, []);

    const handleRoleChange = useCallback((newRole: string) => {
        setRole(newRole);
        setPageNumber(1);
    }, []);

    const handleFromDateChange = useCallback((newDate: string) => {
        setFromDate(newDate);
        setPageNumber(1);
    }, []);

    const handleToDateChange = useCallback((newDate: string) => {
        setToDate(newDate);
        setPageNumber(1);
    }, []);

    return (
        <section className={styles.tablePanel}>
            {/* Thanh tìm kiếm & bộ lọc đa chiều */}
            <AuditLogFilterBar
                keyword={keyword}
                module={module}
                role={role}
                fromDate={fromDate}
                toDate={toDate}
                onKeywordChange={handleKeywordChange}
                onModuleChange={handleModuleChange}
                onRoleChange={handleRoleChange}
                onFromDateChange={handleFromDateChange}
                onToDateChange={handleToDateChange}
            />

            {/* Bảng dữ liệu hiển thị giá trị Trước / Sau trực tiếp */}
            <AuditLogTable logs={logs} isLoading={isLoading} />

            {/* Thanh phân trang */}
            <AuditLogPagination
                pageNumber={pageNumber}
                totalPages={totalPages}
                totalCount={totalCount}
                onPageChange={(p) => setPageNumber(p)}
            />
        </section>
    );
};

export default AuditLogManagement;

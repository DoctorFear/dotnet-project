import React from 'react';
import styles from './AuditLog.module.css';

interface AuditLogPaginationProps {
    pageNumber: number;
    totalPages: number;
    totalCount: number;
    onPageChange: (page: number) => void;
}

export const AuditLogPagination: React.FC<AuditLogPaginationProps> = ({
    pageNumber,
    totalPages,
    totalCount,
    onPageChange,
}) => {
    if (totalCount === 0) {
        return (
            <div className={styles.paginationBar}>
                <span>0 bản ghi</span>
            </div>
        );
    }

    // Hiển thị tối đa 5 nút trang
    const getPageNumbers = () => {
        const pages: number[] = [];
        const maxVisible = 5;
        let start = Math.max(1, pageNumber - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    const pages = getPageNumbers();

    return (
        <div className={styles.paginationBar}>
            <span>
                Trang <b>{pageNumber}</b> / <b>{totalPages}</b> ({totalCount} sự kiện)
            </span>

            <div className={styles.pageBtns}>
                <button
                    type="button"
                    className={styles.pageBtn}
                    onClick={() => onPageChange(pageNumber - 1)}
                    disabled={pageNumber <= 1}
                    aria-label="Trang trước"
                >
                    ‹
                </button>

                {pages.map((p) => (
                    <button
                        key={p}
                        type="button"
                        className={`${styles.pageBtn} ${p === pageNumber ? styles.active : ''}`}
                        onClick={() => onPageChange(p)}
                    >
                        {p}
                    </button>
                ))}

                <button
                    type="button"
                    className={styles.pageBtn}
                    onClick={() => onPageChange(pageNumber + 1)}
                    disabled={pageNumber >= totalPages}
                    aria-label="Trang sau"
                >
                    ›
                </button>
            </div>
        </div>
    );
};

export default AuditLogPagination;

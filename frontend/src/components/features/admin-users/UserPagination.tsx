import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './AdminUser.module.css';

interface UserPaginationProps {
    pageNumber: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export const UserPagination: React.FC<UserPaginationProps> = ({
    pageNumber,
    pageSize,
    totalItems,
    totalPages,
    onPageChange,
}) => {
    if (totalItems === 0) return null;

    const startItem = (pageNumber - 1) * pageSize + 1;
    const endItem = Math.min(pageNumber * pageSize, totalItems);

    // Tạo danh sách trang hiển thị
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
            <div>
                Hiển thị <b>{startItem}</b> – <b>{endItem}</b> trên tổng <b>{totalItems}</b> tài khoản
            </div>

            <div className={styles.pageBtns}>
                <button
                    type="button"
                    className={styles.pageBtn}
                    onClick={() => onPageChange(pageNumber - 1)}
                    disabled={pageNumber <= 1}
                    aria-label="Trang trước"
                >
                    <ChevronLeft size={16} />
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
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};

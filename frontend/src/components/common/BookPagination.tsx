import { useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import styles from './BookPagination.module.css';

interface BookPaginationProps {
    page: number;
    pageSize: number;
    totalCount: number;
    pageSizes?: number[];
    itemLabel?: string;
    variant?: 'storefront' | 'admin';
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
}

export default function BookPagination({ page, pageSize, totalCount, pageSizes = [6, 9, 12, 18, 30], itemLabel = 'sách', variant = 'storefront', onPageChange, onPageSizeChange }: BookPaginationProps) {
    const [isOpen, setIsOpen] = useState(false);
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const firstPage = Math.max(1, Math.min(page - 1, totalPages - 2));
    const visiblePages = Array.from({ length: Math.min(3, totalPages) }, (_, index) => firstPage + index);
    const sizes = [...new Set([...pageSizes, pageSize])].sort((left, right) => left - right);
    return (
        <nav className={`${styles.bar} ${variant === 'admin' ? styles.adminBar : ''}`} aria-label={`Phân trang ${itemLabel}`}>
            <div className={styles.sizeGroup}>
                <span>Hiển thị</span>
                <div className={styles.dropdown} onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false); }}>
                    <button type="button" className={styles.sizeButton} aria-label={`Số ${itemLabel} mỗi trang`} aria-expanded={isOpen} onClick={() => setIsOpen((current) => !current)} onKeyDown={(event) => { if (event.key === 'Escape') setIsOpen(false); if (event.key === 'ArrowDown') setIsOpen(true); }}>
                        {pageSize}<ChevronDown size={14} />
                    </button>
                    {isOpen && <div className={styles.options}>
                        {sizes.map((size) => <button type="button" key={size} aria-pressed={size === pageSize} className={size === pageSize ? styles.selectedOption : ''} onClick={() => { onPageSizeChange(size); setIsOpen(false); }}>{size}</button>)}
                    </div>}
                </div>
                <span>{itemLabel}/trang</span>
            </div>
            <div className={styles.summary}>
                <span><strong>{totalCount === 0 ? '0' : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, totalCount)}`}</strong> / {totalCount} {itemLabel}</span>
                <progress className={styles.progress} value={totalCount === 0 ? 0 : Math.min(page * pageSize, totalCount)} max={Math.max(1, totalCount)} aria-label="Tiến độ phân trang" />
            </div>
            <div className={styles.controls}>
                <button type="button" title="Trang đầu" aria-label="Trang đầu" disabled={page <= 1} onClick={() => onPageChange(1)}><ChevronsLeft size={16} /></button>
                <button type="button" title="Trang trước" aria-label="Trang trước" disabled={page <= 1} onClick={() => onPageChange(page - 1)}><ChevronLeft size={16} /></button>
                {visiblePages.map((number) => <button type="button" key={number} className={number === page ? styles.active : ''} aria-current={number === page ? 'page' : undefined} aria-label={`Trang ${number}`} onClick={() => onPageChange(number)}>{number}</button>)}
                <button type="button" title="Trang sau" aria-label="Trang sau" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}><ChevronRight size={16} /></button>
                <button type="button" title="Trang cuối" aria-label="Trang cuối" disabled={page >= totalPages} onClick={() => onPageChange(totalPages)}><ChevronsRight size={16} /></button>
            </div>
        </nav>
    );
}

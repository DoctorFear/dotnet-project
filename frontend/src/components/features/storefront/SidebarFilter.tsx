import React, { useState } from 'react';
import styles from './SidebarFilter.module.css';
import PriceRangeSlider from './PriceRangeSlider';

export interface FilterParams {
    categories: string[];
    publishers: string[];
    minPrice: number;
    maxPrice: number;
    publishYear: string;
    minRating: number;
    hasPhysical: boolean;
    hasEBook: boolean;
    hasRental: boolean;
}

interface SidebarFilterProps {
    categoriesList?: string[];
    publishersList?: string[];
    onFilterChange: (filters: Partial<FilterParams>) => void;
    onResetFilters: () => void;
    className?: string;
}

export const SidebarFilter: React.FC<SidebarFilterProps> = ({
    categoriesList = ['Văn học Việt Nam', 'Văn học Cổ điển', 'Tiểu thuyết Trinh thám', 'Khoa học Viễn tưởng', 'Triết học Phương Đông'],
    publishersList = ['NXB Giáo dục', 'NXB Trẻ', 'NXB Kim Đồng', 'NXB Hội Nhà Văn', 'NXB Phụ Nữ'],
    onFilterChange,
    onResetFilters,
    className = '',
}) => {
    const [minPrice, setMinPrice] = useState<number>(0);
    const [maxPrice, setMaxPrice] = useState<number>(1000000);

    const handlePriceChange = (min: number, max: number) => {
        setMinPrice(min);
        setMaxPrice(max);
        onFilterChange({ minPrice: min, maxPrice: max });
    };

    return (
        <aside className={`${styles.searchSidebar} ${className}`}>
            <h3 className={styles.sidebarSectionTitle}>
                <svg className={styles.icon} viewBox="0 0 24 24">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                Bộ lọc tìm kiếm
            </h3>

            {/* Lọc Thể loại sách */}
            <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Thể loại sách</label>
                <div className={styles.optimizedListBox}>
                    {categoriesList.map((cat, idx) => (
                        <label key={idx} className={styles.optimizedItem}>
                            <input type="checkbox" onChange={(e) => onFilterChange({ categories: [cat] })} />
                            {cat}
                        </label>
                    ))}
                </div>
            </div>

            {/* Lọc Nhà xuất bản */}
            <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Nhà xuất bản</label>
                <div className={styles.optimizedListBox}>
                    {publishersList.map((pub, idx) => (
                        <label key={idx} className={styles.optimizedItem}>
                            <input type="checkbox" onChange={(e) => onFilterChange({ publishers: [pub] })} />
                            {pub}
                        </label>
                    ))}
                </div>
            </div>

            {/* Thanh kéo khoảng giá */}
            <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Khoảng giá lọc (VND)</label>
                <PriceRangeSlider minPrice={minPrice} maxPrice={maxPrice} onChange={handlePriceChange} />
            </div>

            {/* Lọc Năm xuất bản */}
            <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Năm xuất bản</label>
                <select
                    className={styles.sidebarInput}
                    onChange={(e) => onFilterChange({ publishYear: e.target.value })}
                >
                    <option value="">Tất cả các năm</option>
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                </select>
            </div>

            {/* Lọc Đánh giá sao */}
            <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Đánh giá sao</label>
                <label className={styles.starFilterOption}>
                    <input type="radio" name="starFilter" defaultChecked onChange={() => onFilterChange({ minRating: 0 })} />
                    <span>Tất cả đánh giá</span>
                </label>
                <label className={styles.starFilterOption}>
                    <input type="radio" name="starFilter" onChange={() => onFilterChange({ minRating: 4 })} />
                    <span className={styles.starsGold}>★★★★☆</span> từ 4 sao trở lên
                </label>
            </div>

            <button type="button" className={styles.btnResetFilters} onClick={onResetFilters}>
                Xóa tất cả bộ lọc
            </button>
        </aside>
    );
};

export default SidebarFilter;
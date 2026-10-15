import React from 'react';
import { Funnel } from 'lucide-react';
import styles from './SidebarFilter.module.css';
import PriceRangeSlider from './PriceRangeSlider';

import type { StorefrontFilterParams as FilterParams } from '../../../types/book';

interface SidebarFilterProps {
    publicationYears?: number[];
    filters?: Partial<FilterParams>;
    categoriesList?: { id: number; name: string }[];
    publishersList?: { id: number; name: string }[];
    onFilterChange: (filters: Partial<FilterParams>) => void;
    onResetFilters: () => void;
    className?: string;
}

export const SidebarFilter: React.FC<SidebarFilterProps> = ({
    categoriesList = [],
    publishersList = [],
    onFilterChange,
    onResetFilters,
    className = '',
    filters = {},
    publicationYears = [],
}) => {
    const minPrice = filters.minPrice ?? 0;
    const maxPrice = filters.maxPrice ?? 1000000;
    const ratingGroup = filters.maxRatingExclusive === 3 ? 'below3' : filters.minRating ? String(filters.minRating) : 'all';

    // Lựa chọn thể loại và nhà xuất bản do bộ điều khiển trang quản lý.
    const selectedCategories = filters.categoryIds ?? [];
    const selectedPublishers = filters.publisherIds ?? [];

    const handlePriceChange = (min: number, max: number) => {
        onFilterChange({ minPrice: min, maxPrice: max });
    };

    // Logic xử lý tích/bỏ tích chọn nhiều Thể loại
    const handleCategoryToggle = (categoryId: number) => {
        const nextCategories = selectedCategories.includes(categoryId)
            ? selectedCategories.filter((id) => id !== categoryId)
            : [...selectedCategories, categoryId];

        onFilterChange({ categoryIds: nextCategories });
    };

    // Logic xử lý tích/bỏ tích chọn nhiều Nhà xuất bản
    const handlePublisherToggle = (publisherId: number) => {
        const nextPublishers = selectedPublishers.includes(publisherId)
            ? selectedPublishers.filter((id) => id !== publisherId)
            : [...selectedPublishers, publisherId];

        onFilterChange({ publisherIds: nextPublishers });
    };

    // Xóa sạch trạng thái chọn khi Reset bộ lọc
    const handleResetAll = () => {
        onResetFilters();
    };

    return (
        <aside className={`${styles.searchSidebar} ${className}`}>
            <h3 className={styles.sidebarSectionTitle}>
                <Funnel className={styles.icon} />
                Bộ lọc tìm kiếm
            </h3>

            {/* Lọc Thể loại sách */}
            <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Thể loại sách</label>
                <div className={styles.optimizedListBox}>
                    {categoriesList.map((cat) => (
                        <label key={cat.id} className={styles.optimizedItem}>
                            <input
                                type="checkbox"
                                checked={selectedCategories.includes(cat.id)}
                                onChange={() => handleCategoryToggle(cat.id)}
                            />
                            {cat.name}
                        </label>
                    ))}
                </div>
            </div>

            {/* Lọc Nhà xuất bản */}
            <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Nhà xuất bản</label>
                <div className={styles.optimizedListBox}>
                    {publishersList.map((pub) => (
                        <label key={pub.id} className={styles.optimizedItem}>
                            <input
                                type="checkbox"
                                checked={selectedPublishers.includes(pub.id)}
                                onChange={() => handlePublisherToggle(pub.id)}
                            />
                            {pub.name}
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
                    value={filters.publishYear ?? ''}
                    onChange={(e) => onFilterChange({ publishYear: e.target.value })}
                >
                    <option value="">Tất cả các năm</option>
                    {publicationYears.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
            </div>

            {/* Lọc Đánh giá sao */}
            <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Đánh giá sao</label>
                <label className={styles.starFilterOption}>
                    <input type="radio" name="starFilter" checked={ratingGroup === 'all'} onChange={() => onFilterChange({ minRating: 0, maxRatingExclusive: undefined })} />
                    <span>Tất cả đánh giá</span>
                </label>
                {[
                    { value: '5', label: '5 sao', stars: '★★★★★', min: 5, max: undefined },
                    { value: '4', label: '4 sao', stars: '★★★★☆', min: 4, max: 5 },
                    { value: '3', label: '3 sao', stars: '★★★☆☆', min: 3, max: 4 },
                    { value: 'below3', label: 'Dưới 3 sao', stars: '★★☆☆☆', min: 0, max: 3 },
                ].map((option) => (
                    <label key={option.value} className={styles.starFilterOption}>
                        <input type="radio" name="starFilter" checked={ratingGroup === option.value} onChange={() => onFilterChange({ minRating: option.min, maxRatingExclusive: option.max })} />
                        <span className={styles.starsGold}>{option.stars}</span> {option.label}
                    </label>
                ))}
            </div>

            <button type="button" className={styles.btnResetFilters} onClick={handleResetAll}>
                Xóa tất cả bộ lọc
            </button>
        </aside>
    );
};

export default SidebarFilter;

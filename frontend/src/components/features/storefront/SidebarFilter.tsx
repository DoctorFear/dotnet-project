import React, { useState } from 'react';
import { Funnel } from 'lucide-react';
import styles from './SidebarFilter.module.css';
import PriceRangeSlider from './PriceRangeSlider';

export interface FilterParams {
    categoryIds: number[];
    publisherIds: number[];
    minPrice: number;
    maxPrice: number;
    publishYear: string;
    minRating: number;
    maxRatingExclusive?: number;
    hasPhysical: boolean;
    hasEBook: boolean;
    hasRental: boolean;
}

interface SidebarFilterProps {
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
}) => {
    const [minPrice, setMinPrice] = useState<number>(0);
    const [maxPrice, setMaxPrice] = useState<number>(1000000);
    const [ratingGroup, setRatingGroup] = useState('all');

    // State lưu danh sách các thể loại và NXB được tích chọn (hỗ trợ nhiều item khi lấy từ DB)
    const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
    const [selectedPublishers, setSelectedPublishers] = useState<number[]>([]);

    const handlePriceChange = (min: number, max: number) => {
        setMinPrice(min);
        setMaxPrice(max);
        onFilterChange({ minPrice: min, maxPrice: max });
    };

    // Logic xử lý tích/bỏ tích chọn nhiều Thể loại
    const handleCategoryToggle = (categoryId: number) => {
        const nextCategories = selectedCategories.includes(categoryId)
            ? selectedCategories.filter((id) => id !== categoryId)
            : [...selectedCategories, categoryId];

        setSelectedCategories(nextCategories);
        onFilterChange({ categoryIds: nextCategories });
    };

    // Logic xử lý tích/bỏ tích chọn nhiều Nhà xuất bản
    const handlePublisherToggle = (publisherId: number) => {
        const nextPublishers = selectedPublishers.includes(publisherId)
            ? selectedPublishers.filter((id) => id !== publisherId)
            : [...selectedPublishers, publisherId];

        setSelectedPublishers(nextPublishers);
        onFilterChange({ publisherIds: nextPublishers });
    };

    // Xóa sạch trạng thái chọn khi Reset bộ lọc
    const handleResetAll = () => {
        setSelectedCategories([]);
        setSelectedPublishers([]);
        setMinPrice(0);
        setMaxPrice(1000000);
        setRatingGroup('all');
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
                    <input type="radio" name="starFilter" checked={ratingGroup === 'all'} onChange={() => { setRatingGroup('all'); onFilterChange({ minRating: 0, maxRatingExclusive: undefined }); }} />
                    <span>Tất cả đánh giá</span>
                </label>
                {[
                    { value: '5', label: '5 sao', stars: '★★★★★', min: 5, max: undefined },
                    { value: '4', label: '4 sao', stars: '★★★★☆', min: 4, max: 5 },
                    { value: '3', label: '3 sao', stars: '★★★☆☆', min: 3, max: 4 },
                    { value: 'below3', label: 'Dưới 3 sao', stars: '★★☆☆☆', min: 0, max: 3 },
                ].map((option) => (
                    <label key={option.value} className={styles.starFilterOption}>
                        <input type="radio" name="starFilter" checked={ratingGroup === option.value} onChange={() => { setRatingGroup(option.value); onFilterChange({ minRating: option.min, maxRatingExclusive: option.max }); }} />
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

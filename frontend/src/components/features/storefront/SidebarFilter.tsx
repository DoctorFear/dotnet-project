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
    categoriesList = ['Văn học Việt Nam', 'Văn học Cổ điển', 'Tiểu thuyết Trinh thám', 'Tiểu thuyết Thiếu niên', 'Khoa học Viễn tưởng', 'Triết học Phương Đông', 'Lịch sử khảo cổ', 'Bí ẩn', 'Truyện tâm linh', 'Sách Kỹ năng sống'],
    publishersList = ['NXB Giáo dục', 'NXB Trẻ', 'NXB Kim Đồng', 'NXB Hội Nhà Văn', 'NXB Phụ Nữ', 'NXB Văn Học', 'NXB Tổng Hợp', 'NXB Chính trị Quốc Gia'],
    onFilterChange,
    onResetFilters,
    className = '',
}) => {
    const [minPrice, setMinPrice] = useState<number>(0);
    const [maxPrice, setMaxPrice] = useState<number>(1000000);

    // State lưu danh sách các thể loại và NXB được tích chọn (hỗ trợ nhiều item khi lấy từ DB)
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedPublishers, setSelectedPublishers] = useState<string[]>([]);

    const handlePriceChange = (min: number, max: number) => {
        setMinPrice(min);
        setMaxPrice(max);
        onFilterChange({ minPrice: min, maxPrice: max });
    };

    // Logic xử lý tích/bỏ tích chọn nhiều Thể loại
    const handleCategoryToggle = (category: string) => {
        const nextCategories = selectedCategories.includes(category)
            ? selectedCategories.filter((c) => c !== category)
            : [...selectedCategories, category];

        setSelectedCategories(nextCategories);
        onFilterChange({ categories: nextCategories });
    };

    // Logic xử lý tích/bỏ tích chọn nhiều Nhà xuất bản
    const handlePublisherToggle = (publisher: string) => {
        const nextPublishers = selectedPublishers.includes(publisher)
            ? selectedPublishers.filter((p) => p !== publisher)
            : [...selectedPublishers, publisher];

        setSelectedPublishers(nextPublishers);
        onFilterChange({ publishers: nextPublishers });
    };

    // Xóa sạch trạng thái chọn khi Reset bộ lọc
    const handleResetAll = () => {
        setSelectedCategories([]);
        setSelectedPublishers([]);
        setMinPrice(0);
        setMaxPrice(1000000);
        onResetFilters();
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
                            <input
                                type="checkbox"
                                checked={selectedCategories.includes(cat)}
                                onChange={() => handleCategoryToggle(cat)}
                            />
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
                            <input
                                type="checkbox"
                                checked={selectedPublishers.includes(pub)}
                                onChange={() => handlePublisherToggle(pub)}
                            />
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

            <button type="button" className={styles.btnResetFilters} onClick={handleResetAll}>
                Xóa tất cả bộ lọc
            </button>
        </aside>
    );
};

export default SidebarFilter;
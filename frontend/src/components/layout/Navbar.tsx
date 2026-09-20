import React from 'react';
import styles from './Navbar.module.css';

export interface CategoryItem {
    id: string;
    name: string;
}

export interface PublisherItem {
    id: string;
    name: string;
}

export interface NavbarProps {
    categories?: CategoryItem[];
    publishers?: PublisherItem[];
    membershipRank?: string;
    fPoints?: number;
    onSelectCategory?: (categoryName: string) => void;
    onSelectPublisher?: (publisherName: string) => void;
    onSelectPromotion?: () => void;
    className?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
    categories = [
        { id: '1', name: 'Văn học Việt Nam' },
        { id: '2', name: 'Văn học Cổ điển' },
        { id: '3', name: 'Tiểu thuyết Trinh thám' },
        { id: '4', name: 'Tiểu thuyết Thiếu niên' },
        { id: '5', name: 'Khoa học Viễn tưởng' },
        { id: '6', name: 'Triết học Phương Đông' },
        { id: '7', name: 'Lịch sử & Khảo cổ' },
        { id: '8', name: 'Bí ẩn' },
        { id: '9', name: 'Truyện tâm linh' },
        { id: '10', name: 'Sách Kỹ năng sống' } 
    ],
    publishers = [
        { id: '1', name: 'NXB Giáo dục' },
        { id: '2', name: 'NXB Trẻ' },
        { id: '3', name: 'NXB Kim Đồng' },
        { id: '4', name: 'NXB Hội Nhà Văn' },
        { id: '5', name: 'NXB Chính trị Quốc gia' },
        { id: '6', name: 'NXB Phụ Nữ' },
        { id: '7', name: 'NXB Văn Học' },
        { id: '8', name: 'NXB Tổng Hợp' }
    ],
    membershipRank = 'Hạng Bạc',
    fPoints = 240,
    onSelectCategory,
    onSelectPublisher,
    onSelectPromotion,
    className = '',
}) => {
    return (
        <div className={`${styles.navbarSub} ${className}`}>
            <div className={styles.subNavContent}>
                <ul className={styles.navCategories}>
                    {/* Dropdown 1: Danh mục thể loại */}
                    <li className={styles.categoryDropdownWrapper}>
                        <span className={styles.categoryTrigger}>
                            <svg className={styles.icon} viewBox="0 0 24 24">
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                            <span>Danh mục thể loại</span>
                            <svg className={`${styles.icon} ${styles.iconChevron}`} viewBox="0 0 24 24" style={{ width: 13, height: 13 }}>
                                <path d="m6 9 6 6 6-6" />
                            </svg>
                        </span>
                        <div className={styles.megaCategoriesMenu}>
                            {categories.map((cat) => (
                                <span
                                    key={cat.id}
                                    className={styles.megaCategoryItem}
                                    onClick={() => onSelectCategory?.(cat.name)}
                                >
                                    <span className={styles.catBullet}></span>
                                    {cat.name}
                                </span>
                            ))}
                        </div>
                    </li>

                    {/* Dropdown 2: Nhà xuất bản */}
                    <li className={styles.categoryDropdownWrapper}>
                        <span className={styles.categoryTrigger}>
                            <svg className={styles.icon} viewBox="0 0 24 24">
                                <path d="M4 22V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v18l-8-4-8 4z" />
                            </svg>
                            <span>Nhà xuất bản</span>
                            <svg className={`${styles.icon} ${styles.iconChevron}`} viewBox="0 0 24 24" style={{ width: 13, height: 13 }}>
                                <path d="m6 9 6 6 6-6" />
                            </svg>
                        </span>
                        <div className={`${styles.megaCategoriesMenu} ${styles.megaPublisherMenu}`}>
                            {publishers.map((pub) => (
                                <span
                                    key={pub.id}
                                    className={styles.megaCategoryItem}
                                    onClick={() => onSelectPublisher?.(pub.name)}
                                >
                                    <span className={styles.catBullet}></span>
                                    {pub.name}
                                </span>
                            ))}
                        </div>
                    </li>
                </ul>

                {/* Khối Điểm thưởng thành viên */}
                <div className={styles.membershipInfo}>
                    Thành viên: <strong className={styles.membershipRankText}>{membershipRank} ({fPoints} F-Points)</strong>
                </div>
            </div>
        </div>
    );
};

export default Navbar;
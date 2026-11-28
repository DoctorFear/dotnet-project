import React, { useEffect, useState } from 'react';
import styles from './Navbar.module.css';
import { useUser } from '../../context/UserContext';
import { workflowService } from '../../services/workflowService';
import type { WorkflowNotification } from '../../types/workflow';

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
    onSelectCategory?: (categoryName: string) => void;
    onSelectPublisher?: (publisherName: string) => void;
    onSelectPromotion?: () => void;
    showCategories?: boolean;
    showPublishers?: boolean;
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
    onSelectCategory,
    onSelectPublisher,
    showCategories = true,
    showPublishers = true,
    className = '',
}) => {
    const { isLoggedIn, user, updateUser } = useUser();
    const [memberNotifications, setMemberNotifications] = useState<WorkflowNotification[]>([]);
    const [notificationError, setNotificationError] = useState('');

    useEffect(() => {
        if (!isLoggedIn || user?.role !== 'Member') return;
        let active = true;
        const loadNotifications = async () => {
            try {
                const [result, balance] = await Promise.all([
                    workflowService.notifications(),
                    workflowService.balance(),
                ]);
                if (active) {
                    setMemberNotifications(result.items);
                    setNotificationError('');
                    if (user?.fPoints !== balance.currentPoints || user?.membershipTierName !== balance.tierName) {
                        updateUser({ fPoints: balance.currentPoints, membershipTierName: balance.tierName });
                    }
                }
            } catch {
                if (active) setNotificationError('Không thể tải thông báo lúc này.');
            }
        };
        void loadNotifications();
        const timer = window.setInterval(() => void loadNotifications(), 60_000);
        window.addEventListener('focus', loadNotifications);
        return () => {
            active = false;
            window.clearInterval(timer);
            window.removeEventListener('focus', loadNotifications);
        };
    }, [isLoggedIn, updateUser, user?.fPoints, user?.id, user?.membershipTierName, user?.role]);

    const currentPoints = isLoggedIn && user ? user.fPoints ?? 0 : 0;
    const currentRank = user?.membershipTierName
        ? `Hạng ${user.membershipTierName}`
        : 'Hạng thành viên';

    return (
        <div className={`${styles.navbarSub} ${className}`}>
            <div className={styles.subNavContent}>
                {/* Phần bên trái: Nếu ẩn cả 2 thì để placeholder trống nhưng giữ cấu trúc */}
                {showCategories || showPublishers ? (
                    <ul className={styles.navCategories}>
                        {/* Dropdown 1: Danh mục thể loại */}
                        {showCategories && (
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
                        )}

                        {/* Dropdown 2: Nhà xuất bản */}
                        {showPublishers && (
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
                        )}
                    </ul>
                ) : (
                    <div className={styles.emptyLeftPlaceholder} aria-hidden="true"></div>
                )}

                {/* Khối Điểm thưởng thành viên bên phải */}
                <div className={styles.memberArea}>
                    {isLoggedIn && user?.role === 'Member' && (
                        <details className={styles.notificationCenter}>
                            <summary className={styles.notificationTrigger} aria-label="Mở trung tâm thông báo">
                                <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                                    <path d="M10 21h4" />
                                </svg>
                                {memberNotifications.length > 0 && (
                                    <span className={styles.notificationBadge}>{Math.min(memberNotifications.length, 20)}</span>
                                )}
                            </summary>
                            <section className={styles.notificationMenu} aria-label="Thông báo của thành viên">
                                <strong className={styles.notificationTitle}>Thông báo</strong>
                                {notificationError && <p className={styles.notificationState} role="alert">{notificationError}</p>}
                                {!notificationError && memberNotifications.length === 0 && (
                                    <p className={styles.notificationState}>Chưa có thông báo mới.</p>
                                )}
                                {memberNotifications.slice(0, 8).map(notification => (
                                    <article className={styles.notificationItem} key={notification.id}>
                                        <p>{notification.message}</p>
                                        <time dateTime={notification.createdAt}>
                                            {new Date(notification.createdAt).toLocaleString('vi-VN')}
                                        </time>
                                    </article>
                                ))}
                            </section>
                        </details>
                    )}
                    <div className={styles.membershipInfo}>
                        {isLoggedIn ? (
                            <>
                                Thành viên: <strong className={styles.membershipRankText}>{currentRank} ({currentPoints} F-Points)</strong>
                            </>
                        ) : (
                            <span>Đăng nhập để tích lũy điểm <strong>F-Points</strong></span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Navbar;

import React from 'react';
import { Search } from 'lucide-react';
import type { StaffChatSessionDto, ChatSessionStatus } from '../../../types/chat';
import styles from './StaffChatConsole.module.css';

interface ChatQueueSidebarProps {
    sessions: StaffChatSessionDto[];
    activeSessionId: number | null;
    activeTab: ChatSessionStatus;
    searchQuery: string;
    onTabChange: (tab: ChatSessionStatus) => void;
    onSearchChange: (query: string) => void;
    onSelectSession: (session: StaffChatSessionDto) => void;
}

export const ChatQueueSidebar: React.FC<ChatQueueSidebarProps> = ({
    sessions,
    activeSessionId,
    activeTab,
    searchQuery,
    onTabChange,
    onSearchChange,
    onSelectSession,
}) => {
    // Lọc danh sách theo từ khóa tìm kiếm (Tên, Email, SĐT)
    const filteredSessions = sessions.filter((s) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            s.customerName.toLowerCase().includes(q) ||
            (s.customerEmail && s.customerEmail.toLowerCase().includes(q)) ||
            (s.customerPhone && s.customerPhone.includes(q))
        );
    });

    const getStatusText = (status: ChatSessionStatus | number) => {
        if (status === 'Pending' || status === 1) return 'Đang chờ';
        if (status === 'Active' || status === 2) return 'Đang xử lý';
        return 'Đã đóng';
    };

    const getStatusBadgeClass = (status: ChatSessionStatus | number) => {
        if (status === 'Pending' || status === 1) return styles.statusBadgePending;
        if (status === 'Active' || status === 2) return styles.statusBadgeProcessing;
        return styles.statusBadgeClosed;
    };

    const formatTime = (timeStr?: string) => {
        if (!timeStr) return '';
        try {
            return new Date(timeStr).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return '';
        }
    };

    const getInitials = (name: string) => {
        if (!name) return 'KH';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    return (
        <aside className={styles.conversationsSidebar}>
            <div className={styles.convSearchBox}>
                <div className={styles.searchWrap}>
                    <Search size={15} className={styles.searchIcon} />
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Tìm theo tên, email khách hàng..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>

                <div className={styles.filterTabs}>
                    <button
                        type="button"
                        className={`${styles.tabBtn} ${activeTab === 'Pending' ? styles.active : ''}`}
                        onClick={() => onTabChange('Pending')}
                    >
                        Chờ tiếp nhận
                    </button>
                    <button
                        type="button"
                        className={`${styles.tabBtn} ${activeTab === 'Active' ? styles.active : ''}`}
                        onClick={() => onTabChange('Active')}
                    >
                        Đang xử lý
                    </button>
                    <button
                        type="button"
                        className={`${styles.tabBtn} ${activeTab === 'Closed' ? styles.active : ''}`}
                        onClick={() => onTabChange('Closed')}
                    >
                        Đã kết thúc
                    </button>
                </div>
            </div>

            <ul className={styles.convList}>
                {filteredSessions.length === 0 ? (
                    <li className={styles.emptyQueue}>Không có phiên chat nào trong mục này.</li>
                ) : (
                    filteredSessions.map((session) => {
                        const isActive = session.id === activeSessionId;
                        return (
                            <li
                                key={session.id}
                                className={`${styles.convItem} ${isActive ? styles.active : ''}`}
                                onClick={() => onSelectSession(session)}
                            >
                                <div className={styles.convAvatarBox}>
                                    <div className={styles.convAvatar}>
                                        {getInitials(session.customerName)}
                                    </div>
                                </div>
                                <div className={styles.convMeta}>
                                    <div className={styles.convTopline}>
                                        <div className={styles.convName}>{session.customerName}</div>
                                        <span className={styles.convTime}>
                                            {formatTime(session.lastActivityAt || session.startedAt)}
                                        </span>
                                    </div>
                                    <div className={styles.convPreview}>
                                        {session.lastMessagePreview || 'Chưa có tin nhắn...'}
                                    </div>
                                    <div className={styles.convBottomline}>
                                        <span className={getStatusBadgeClass(session.status)}>
                                            {getStatusText(session.status)}
                                        </span>
                                        {session.unreadCount > 0 && (
                                            <span className={styles.unreadCount}>
                                                {session.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </li>
                        );
                    })
                )}
            </ul>
        </aside>
    );
};

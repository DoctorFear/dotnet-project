import React, { useState } from 'react';
import { BookOpen, X } from 'lucide-react';
import styles from '../../../pages/EbookReaderPage.module.css';

interface Props {
    isOpen: boolean;
    toc: { title: string; pageIndex: number }[];
    currentPage: number;
    onClose: () => void;
    onJumpToPage: (pageNum: number) => void;
}

export const ReaderTocDrawer: React.FC<Props> = ({ isOpen, toc, currentPage, onClose, onJumpToPage }) => {
    const [search, setSearch] = useState('');

    if (!isOpen) return null;

    const filtered = toc.filter((item) => item.title.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className={styles.tocDrawerOverlay} onClick={onClose}>
            <aside className={styles.tocDrawer} onClick={(e) => e.stopPropagation()}>
                <div className={styles.tocHeader}>
                    <div>
                        <h3 className={styles.tocTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                            <BookOpen size={18} />
                            <span>Mục lục tác phẩm</span>
                        </h3>
                        <span className={styles.tocSubTitle}>{toc.length} chương / phần mục</span>
                    </div>
                    <button type="button" className={styles.closeBtn} onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className={styles.tocSearchBox}>
                    <input
                        type="text"
                        className={styles.tocSearchInput}
                        placeholder="Tìm chương mục..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className={styles.tocList}>
                    {filtered.length > 0 ? (
                        filtered.map((item, idx) => {
                            const isCurrent =
                                currentPage >= item.pageIndex &&
                                (idx === filtered.length - 1 || currentPage < filtered[idx + 1].pageIndex);

                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    className={`${styles.tocItemBtn} ${isCurrent ? styles.activeTocItem : ''}`}
                                    onClick={() => {
                                        onJumpToPage(item.pageIndex);
                                        onClose();
                                    }}
                                >
                                    <span className={styles.tocItemTitle}>{item.title}</span>
                                    <span className={styles.tocItemPage}>Trang {item.pageIndex}</span>
                                </button>
                            );
                        })
                    ) : (
                        <div className={styles.emptyNotice}>Không tìm thấy chương mục phù hợp.</div>
                    )}
                </div>
            </aside>
        </div>
    );
};

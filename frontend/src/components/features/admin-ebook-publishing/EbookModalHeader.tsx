import React from 'react';
import { X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import type { AdminBookData } from '../../../types/book';
import type { EditionPublishStatusType } from '../../../types/ebookPublishing';
import styles from './EbookPublishingModal.module.css';

interface Props {
    book: AdminBookData;
    editionId: number | null;
    status: EditionPublishStatusType | null;
    isBusy: boolean;
    onClose: () => void;
}

export const EbookModalHeader: React.FC<Props> = ({
    book,
    editionId,
    status,
    isBusy,
    onClose,
}) => {
    const renderStatusBadge = () => {
        if (!editionId) {
            return <span className={`${styles.badge} ${styles.badgeNone}`}>Chưa có ấn bản</span>;
        }
        switch (status) {
            case 'Published':
                return (
                    <span className={`${styles.badge} ${styles.badgePublished}`}>
                        <CheckCircle2 size={13} /> Đã xuất bản
                    </span>
                );
            case 'Processing':
                return (
                    <span className={`${styles.badge} ${styles.badgeProcessing}`}>
                        <Loader2 size={13} className={styles.spinner} /> Đang xử lý
                    </span>
                );
            case 'Failed':
                return (
                    <span className={`${styles.badge} ${styles.badgeFailed}`}>
                        <AlertCircle size={13} /> Lỗi nạp tri thức
                    </span>
                );
            default:
                return <span className={`${styles.badge} ${styles.badgeDraft}`}>Bản nháp</span>;
        }
    };

    return (
        <header className={styles.header}>
            <div className={styles.headerLeft}>
                <div className={styles.titleRow}>
                    <h2 id="ebook-publishing-title">Quản lý số hóa & Xuất bản E-Book</h2>
                    {renderStatusBadge()}
                </div>
                <p className={styles.bookInfo}>
                    <strong>{book.title}</strong> · Tác giả: {book.author || 'N/A'} · ISBN: {book.isbn || 'N/A'}
                </p>
            </div>
            <button
                type="button"
                className={styles.close}
                aria-label="Đóng cửa sổ"
                onClick={onClose}
                disabled={isBusy}
            >
                <X size={20} />
            </button>
        </header>
    );
};

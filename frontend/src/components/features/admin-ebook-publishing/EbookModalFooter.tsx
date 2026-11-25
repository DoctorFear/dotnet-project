import React from 'react';
import { Upload, Loader2, Trash2, BookOpen } from 'lucide-react';
import styles from './EbookPublishingModal.module.css';

interface Props {
    savedAt: string | null;
    editionId: number | null;
    bookId?: number | string;
    hasPendingFile?: boolean;
    isPublishing: boolean;
    isBusy: boolean;
    onClose: () => void;
    onSaveDraft: () => void;
    onPublish: () => void;
    onRequestUnpublish?: () => void;
}

export const EbookModalFooter: React.FC<Props> = ({
    savedAt,
    editionId,
    bookId,
    hasPendingFile = false,
    isPublishing,
    isBusy,
    onClose,
    onSaveDraft,
    onPublish,
    onRequestUnpublish,
}) => {
    return (
        <footer className={styles.footer}>
            <div className={styles.footerLeft}>
                <p>
                    Lưu nháp lần cuối:{' '}
                    <strong>
                        {savedAt ? new Date(savedAt).toLocaleString('vi-VN') : 'Chưa lưu'}
                    </strong>
                </p>
                {editionId && bookId && (
                    <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => window.open(`/reader/${bookId}`, '_blank')}
                        disabled={isBusy}
                        title="Mở giao diện đọc trực tuyến (E-Book Reader) trên tab mới"
                    >
                        <BookOpen size={14} /> Xem & Đọc thử
                    </button>
                )}
                {editionId && onRequestUnpublish && (
                    <button
                        type="button"
                        className={styles.dangerButton}
                        onClick={onRequestUnpublish}
                        disabled={isBusy}
                        title="Gỡ bỏ hoàn toàn ấn bản E-Book khỏi cuốn sách này"
                    >
                        <Trash2 size={14} /> Gỡ E-Book
                    </button>
                )}
            </div>

            <div className={styles.footerActions}>
                <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={onClose}
                    disabled={isBusy}
                >
                    Hủy
                </button>

                <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={onSaveDraft}
                    disabled={(!editionId && !hasPendingFile) || isBusy}
                >
                    Lưu bản nháp
                </button>

                <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={onPublish}
                    disabled={(!editionId && !hasPendingFile) || isBusy}
                >
                    {isPublishing ? (
                        <>
                            <Loader2 size={15} className={styles.spinner} /> Đang xuất bản...
                        </>
                    ) : (
                        <>
                            <Upload size={15} /> Xuất bản
                        </>
                    )}
                </button>
            </div>
        </footer>
    );
};

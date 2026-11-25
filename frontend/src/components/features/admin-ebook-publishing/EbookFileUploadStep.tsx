import React, { useRef } from 'react';
import { Loader2 } from 'lucide-react';
import type { EbookPublishingDraftState } from '../../../types/ebookPublishing';
import styles from './EbookPublishingModal.module.css';

interface Props {
    draft: EbookPublishingDraftState;
    isUploading: boolean;
    isBusy: boolean;
    isDragging: boolean;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (files: FileList | null) => void;
    onFileSelected: (files: FileList | null) => void;
}

export const EbookFileUploadStep: React.FC<Props> = ({
    draft,
    isUploading,
    isBusy,
    isDragging,
    onDragOver,
    onDragLeave,
    onDrop,
    onFileSelected,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const unit = draft.format === 'Epub' ? 'chương' : 'trang';

    return (
        <section className={styles.section} aria-labelledby="ebook-file-step">
            <h3 id="ebook-file-step">
                <span>1</span>Tệp nội dung số (PDF / EPUB)
            </h3>

            <div
                className={`${styles.dropZone} ${isDragging ? styles.dragging : ''}`}
                onDragOver={e => {
                    e.preventDefault();
                    onDragOver(e);
                }}
                onDragLeave={onDragLeave}
                onDrop={e => {
                    e.preventDefault();
                    onDrop(e.dataTransfer.files);
                }}
            >
                {isUploading ? (
                    <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <Loader2 size={18} className={styles.spinner} /> Đang tải tệp lên Cloud Storage và bóc tách cấu trúc...
                    </p>
                ) : (
                    <>
                        <p>
                            Kéo thả hoặc{' '}
                            <button
                                type="button"
                                className={styles.fileLink}
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isBusy}
                            >
                                chọn tệp từ máy tính
                            </button>
                        </p>
                        <p>Hỗ trợ tệp định dạng .PDF hoặc .EPUB (Dung lượng tối đa 100MB)</p>
                    </>
                )}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.epub"
                    aria-label="Chọn tệp E-Book PDF hoặc EPUB"
                    className={styles.fileInput}
                    onChange={e => {
                        onFileSelected(e.target.files);
                        e.target.value = '';
                    }}
                    disabled={isBusy}
                />
            </div>

            <dl className={styles.metadata}>
                <div>
                    <dt>Tên tệp</dt>
                    <dd>
                        {draft.fileTitle || (draft.file?.name ?? 'Chưa tải tệp')}
                        {draft.file && (
                            <span className={styles.badgeDraft} style={{ marginLeft: 8, fontSize: 11 }}>
                                Chờ lưu
                            </span>
                        )}
                    </dd>
                </div>
                <div>
                    <dt>Định dạng</dt>
                    <dd>{draft.format ? draft.format.toUpperCase() : '—'}</dd>
                </div>
                <div>
                    <dt>Dung lượng</dt>
                    <dd>
                        {draft.fileSizeBytes > 0
                            ? `${(draft.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB`
                            : '—'}
                    </dd>
                </div>
                <div>
                    <dt>Quy mô</dt>
                    <dd>{draft.totalPages > 0 ? `${draft.totalPages} ${unit}` : '—'}</dd>
                </div>
            </dl>
            <p className={styles.hint}>
                Hệ thống tự động kiểm tra tính toàn vẹn và bóc tách metadata. Nếu phát hiện tệp thiếu trang hoặc lỗi biên tập, bạn có thể tải lên tệp thay thế bất kỳ lúc nào trước khi xuất bản.
            </p>
        </section>
    );
};

import React, { useRef, useState } from 'react';
import { Loader2, Plus, Trash2, FilePlus2, Upload } from 'lucide-react';
import type { EbookPublishingDraftState } from '../../../types/ebookPublishing';
import styles from './EbookPublishingModal.module.css';

interface ChapterInput {
    title: string;
    content: string;
}

interface Props {
    defaultBookTitle?: string;
    draft: EbookPublishingDraftState;
    isUploading: boolean;
    isBusy: boolean;
    isDragging: boolean;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (files: FileList | null) => void;
    onFileSelected: (files: FileList | null) => void;
    onGenerateFile: (payload: {
        fileTitle: string;
        format: 'Epub' | 'Pdf';
        chapters: ChapterInput[];
    }) => Promise<boolean>;
}

export const EbookFileUploadStep: React.FC<Props> = ({
    defaultBookTitle = '',
    draft,
    isUploading,
    isBusy,
    isDragging,
    onDragOver,
    onDragLeave,
    onDrop,
    onFileSelected,
    onGenerateFile,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [mode, setMode] = useState<'upload' | 'create'>('upload');
    const [fileTitle, setFileTitle] = useState<string>(defaultBookTitle);
    const [chapters, setChapters] = useState<ChapterInput[]>([
        { title: 'Chương 1', content: '' },
    ]);

    const unit = draft.format === 'Epub' ? 'chương' : 'trang';

    const updateChapter = (index: number, field: keyof ChapterInput, value: string) => {
        setChapters(prev =>
            prev.map((ch, idx) => (idx === index ? { ...ch, [field]: value } : ch))
        );
    };

    const addChapter = () => {
        setChapters(prev => [
            ...prev,
            { title: `Chương ${prev.length + 1}`, content: '' },
        ]);
    };

    const removeChapter = (index: number) => {
        if (chapters.length <= 1) return;
        setChapters(prev => prev.filter((_, idx) => idx !== index));
    };

    const handleCreateSubmit = async () => {
        const ok = await onGenerateFile({
            fileTitle: fileTitle || defaultBookTitle || 'ebook-moi',
            format: 'Epub',
            chapters,
        });
        if (ok) setMode('upload');
    };

    return (
        <section className={styles.section} aria-labelledby="ebook-file-step">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 id="ebook-file-step" style={{ margin: 0 }}>
                    <span>1</span>Tệp nội dung số (PDF / EPUB)
                </h3>

                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        type="button"
                        className={mode === 'upload' ? styles.primaryButton : styles.secondaryButton}
                        onClick={() => setMode('upload')}
                        disabled={isBusy}
                    >
                        <Upload size={14} style={{ marginRight: 4 }} /> Tải tệp có sẵn
                    </button>
                    <button
                        type="button"
                        className={mode === 'create' ? styles.primaryButton : styles.secondaryButton}
                        onClick={() => setMode('create')}
                        disabled={isBusy}
                    >
                        <FilePlus2 size={14} style={{ marginRight: 4 }} /> Tạo tệp E-Book mới
                    </button>
                </div>
            </div>

            {mode === 'upload' ? (
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
            ) : (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#f8fafc' }}>
                    <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                            Tên tệp xuất bản (.epub)
                        </label>
                        <input
                            type="text"
                            value={fileTitle}
                            onChange={e => setFileTitle(e.target.value)}
                            placeholder="VD: dac-nhan-tam"
                            disabled={isBusy}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                        />
                    </div>

                    {chapters.map((chapter, idx) => (
                        <div
                            key={idx}
                            style={{
                                background: '#fff',
                                border: '1px solid #e2e8f0',
                                borderRadius: 6,
                                padding: 10,
                                marginBottom: 10,
                            }}
                        >
                            <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                                <input
                                    type="text"
                                    value={chapter.title}
                                    onChange={e => updateChapter(idx, 'title', e.target.value)}
                                    placeholder={`Tiêu đề chương ${idx + 1}`}
                                    disabled={isBusy}
                                    style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontWeight: 600 }}
                                />
                                {chapters.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeChapter(idx)}
                                        disabled={isBusy}
                                        className={styles.secondaryButton}
                                        title="Xóa chương"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                            <textarea
                                rows={4}
                                value={chapter.content}
                                onChange={e => updateChapter(idx, 'content', e.target.value)}
                                placeholder="Nhập nội dung văn bản của chương..."
                                disabled={isBusy}
                                style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #cbd5e1', resize: 'vertical' }}
                            />
                        </div>
                    ))}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button
                            type="button"
                            className={styles.secondaryButton}
                            onClick={addChapter}
                            disabled={isBusy}
                        >
                            <Plus size={14} style={{ marginRight: 4 }} /> Thêm chương
                        </button>

                        <button
                            type="button"
                            className={styles.primaryButton}
                            onClick={handleCreateSubmit}
                            disabled={isBusy}
                        >
                            {isUploading ? 'Đang tạo tệp...' : 'Tạo tệp EPUB & Lưu nháp'}
                        </button>
                    </div>
                </div>
            )}

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
        </section>
    );
};
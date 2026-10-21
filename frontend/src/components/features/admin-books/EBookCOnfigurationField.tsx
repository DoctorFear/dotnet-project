import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { useEbookConfiguration } from '../../../hooks/useEbookConfiguration';
import type { EbookDocumentType } from '../../../types/ebookConfiguration';
import styles from './EBookCOnfigurationField.module.css';

const documentTypes: { value: EbookDocumentType; title: string; description: string }[] = [
    { value: 'epub', title: 'EPUB chuẩn', description: 'Sách điện tử có cấu trúc chương' },
    { value: 'pdf', title: 'PDF văn bản', description: 'PDF có thể chọn/copy chữ' },
    { value: 'scan', title: 'Sách scan', description: 'PDF ảnh, không có lớp chữ' },
];

export default function EBookCOnfigurationField({ controller }: { controller: ReturnType<typeof useEbookConfiguration> }) {
    const dialog = useRef<HTMLDialogElement>(null);
    const fileInput = useRef<HTMLInputElement>(null);
    const { book, draft, error, notice, isDragging, close, change, selectFile, selectDocumentType } = controller;

    useEffect(() => {
        const element = dialog.current;
        const previousOverflow = document.body.style.overflow;
        element?.showModal();
        document.body.style.overflow = 'hidden';
        return () => { element?.close(); document.body.style.overflow = previousOverflow; };
    }, []);

    if (!book) return null;
    const isScan = draft.documentType === 'scan';
    const format = draft.file?.name.toLowerCase().endsWith('.epub') ? 'EPUB' : 'PDF';
    const unit = draft.documentType === 'epub' ? 'chương' : 'trang';
    return <dialog ref={dialog} className={styles.modal} aria-labelledby="ebook-modal-title" aria-describedby="ebook-modal-book" onCancel={event => { event.preventDefault(); close(); }}>
        <header className={styles.header}>
            <div><h2 id="ebook-modal-title">Cấu hình E-Book</h2><p id="ebook-modal-book">{book.title} · ISBN {book.isbn}</p></div>
            <button type="button" className={styles.close} aria-label="Đóng cấu hình E-Book" onClick={close}><X size={18} /></button>
        </header>
        <div className={styles.body}>
            <p className={styles.banner}>Chưa xuất bản: khách hàng chưa thể đọc online cho đến khi bấm “Xuất bản”. Sách giấy vẫn bán bình thường.</p>
            <section className={styles.section} aria-labelledby="ebook-file-title">
                <h3 id="ebook-file-title"><span>1</span>File E-Book</h3>
                <div className={`${styles.dropZone} ${isDragging ? styles.dragging : ''}`} onDragOver={event => { event.preventDefault(); controller.setIsDragging(true); }} onDragLeave={() => controller.setIsDragging(false)} onDrop={event => { event.preventDefault(); selectFile(event.dataTransfer.files); }}>
                    <p>Kéo thả hoặc <button type="button" className={styles.fileLink} onClick={() => fileInput.current?.click()}>chọn file PDF / EPUB</button></p>
                    <p>Tối đa 100MB · File được lưu trữ trên Dropbox và tạo bản nháp</p>
                    <input ref={fileInput} type="file" accept=".pdf,.epub" aria-label="Chọn file E-Book PDF hoặc EPUB" className={styles.fileInput} onChange={event => { selectFile(event.target.files); event.target.value = ''; }} />
                </div>
                <dl className={styles.metadata}>
                    <div><dt>Tên file</dt><dd>{draft.file?.name ?? 'Chưa chọn file'}</dd></div>
                    <div><dt>Định dạng</dt><dd>{draft.file ? format : '—'}</dd></div>
                    <div><dt>Dung lượng</dt><dd>{draft.file ? `${(draft.file.size / (1024 * 1024)).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} MB` : '—'}</dd></div>
                    <div><dt>Số {unit}</dt><dd>—</dd></div>
                </dl>
                <p className={styles.hint}>Thông tin file được hệ thống đọc tự động, không cần nhập tay. Tải file mới sẽ thay thế bản nháp hiện tại.</p>
            </section>
            <section className={styles.section} aria-labelledby="ebook-type-title">
                <h3 id="ebook-type-title"><span>2</span>Loại tài liệu</h3>
                <div className={styles.documentTypes} role="radiogroup" aria-labelledby="ebook-type-title">
                    {documentTypes.map(type => <label key={type.value} className={`${styles.typeCard} ${draft.documentType === type.value ? styles.selected : ''}`}>
                        <input type="radio" name="ebookDocumentType" value={type.value} checked={draft.documentType === type.value} onChange={() => selectDocumentType(type.value)} />
                        <strong>{type.title}</strong><p>{type.description}</p>
                        {type.value === 'scan' ? <span className={styles.readOnly}>Chỉ đọc thường</span> : <div className={styles.capabilities}><span>Chat AI</span><span>Giọng đọc</span></div>}
                    </label>)}
                </div>
            </section>
            <section className={styles.section} aria-labelledby="ebook-features-title">
                <h3 id="ebook-features-title"><span>3</span>Tính năng cho người đọc</h3>
                <div className={styles.features}>
                    <label className={styles.feature}><div><strong>Hỏi đáp với Chat AI</strong><p>Người đọc hỏi AI về nội dung sách. Dữ liệu được trích xuất khi xuất bản.</p></div><input className={styles.toggle} type="checkbox" role="switch" aria-label="Hỏi đáp với Chat AI" checked={!isScan && draft.chatEnabled} disabled={isScan} onChange={event => change('chatEnabled', event.target.checked)} /></label>
                    <label className={styles.feature}><div><strong>Nghe giọng đọc</strong><p>Hiện nút nghe khi đã tạo giọng đọc</p></div><input className={styles.toggle} type="checkbox" role="switch" aria-label="Nghe giọng đọc" checked={!isScan && draft.ttsEnabled} disabled={isScan} onChange={event => change('ttsEnabled', event.target.checked)} /></label>
                </div>
            </section>
            <section className={styles.section} aria-labelledby="ebook-tts-title">
                <h3 id="ebook-tts-title"><span>4</span>Giọng đọc (TTS)</h3>
                <fieldset className={styles.ttsFields} disabled={isScan || !draft.ttsEnabled}>
                    <label>Ngôn ngữ<select value={draft.language} onChange={event => change('language', event.target.value)}>{[['vi', 'Tiếng Việt'], ['en', 'Tiếng Anh'], ['fr', 'Tiếng Pháp'], ['ja', 'Tiếng Nhật'], ['zh', 'Tiếng Trung'], ['ko', 'Tiếng Hàn'], ['de', 'Tiếng Đức'], ['es', 'Tiếng Tây Ban Nha']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                    <label>Từ trang / chương<input type="number" min="1" step="1" value={draft.fromPage} onChange={event => change('fromPage', event.target.value)} /></label>
                    <label>Đến trang / chương<input type="number" min={Number(draft.fromPage) || 1} step="1" placeholder="Cuối tài liệu" value={draft.toPage} onChange={event => change('toPage', event.target.value)} /></label>
                </fieldset>
                <div className={styles.audioActions}><p>{isScan ? 'Sách scan chỉ hỗ trợ đọc thường' : 'Chưa tạo giọng đọc'}</p><div><button type="button" className={styles.outlineButton} disabled>Nghe thử</button><button type="button" className={styles.outlineButton} disabled={isScan || !draft.ttsEnabled || !draft.file} onClick={controller.generateAudio}>Tạo giọng đọc</button></div></div>
            </section>
            {error && <p className={styles.error} role="alert">{error}</p>}
            {notice && <p className={styles.notice} role="status">{notice}</p>}
        </div>
        <footer className={styles.footer}><p>Lưu nháp lần cuối: {draft.savedAt ? new Date(draft.savedAt).toLocaleString('vi-VN') : 'Chưa lưu'}</p><div><button type="button" className={styles.secondaryButton} onClick={close}>Hủy</button><button type="button" className={styles.secondaryButton} onClick={controller.saveDraft}>Lưu nháp</button><button type="button" className={styles.primaryButton} onClick={controller.publish}>Xuất bản</button></div></footer>
    </dialog>;
}

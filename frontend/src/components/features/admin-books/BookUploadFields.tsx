import { Upload, Check } from 'lucide-react';
import { useBookImageUpload, useBookEditionUpload } from '../../../hooks/useBookUpload';
import styles from './BookUploadFields.module.css';

export function BookImageUpload({ multiple = false, onUploaded, onBusyChange }: { multiple?: boolean; onUploaded: (urls: string[]) => void; onBusyChange?: (busy: boolean) => void }) {
    const upload = useBookImageUpload(onBusyChange);
    return <div className={styles.field}>
        <label>{multiple ? 'Tải ảnh gallery' : 'Tải ảnh bìa'}<input type="file" accept="image/jpeg,image/png" multiple={multiple} disabled={upload.isUploading} onChange={event => { void upload.upload(event.target.files, onUploaded); event.target.value = ''; }} /></label>
        {upload.isUploading && <span role="status">Đang tải ảnh...</span>}
        {upload.error && <span role="alert">{upload.error}</span>}
    </div>;
}

export function BookEditionUpload({ bookId, onBusyChange }: { bookId: number; onBusyChange?: (busy: boolean) => void }) {
    const controller = useBookEditionUpload(bookId, onBusyChange);
    return <div className={styles.field}>
        <label>Ấn bản PDF/EPUB<input type="file" accept=".pdf,.epub" disabled={controller.isLoading} onChange={event => { void controller.upload(event.target.files?.[0]); event.target.value = ''; }} /></label>
        {controller.edition && <div className={styles.row}><span>{controller.edition.fileTitle} · {controller.edition.status === 'Published' ? 'Đã xuất bản' : 'Bản nháp'}</span>{controller.edition.status !== 'Published' && <button type="button" disabled={controller.isLoading} onClick={() => void controller.publish()}><Upload size={16} />Xuất bản</button>}{controller.edition.status === 'Published' && <Check size={16} />}</div>}
        {controller.isLoading && <span role="status">Đang xử lý ấn bản...</span>}
        {controller.error && <span role="alert">{controller.error}</span>}
    </div>;
}

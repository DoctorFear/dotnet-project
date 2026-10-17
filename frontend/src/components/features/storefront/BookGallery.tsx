import { useEffect, useRef, useState } from 'react';
import { ZoomIn, X } from 'lucide-react';
import styles from './BookGallery.module.css';
import BookCover from '../../common/BookCover';

export default function BookGallery({ title, images }: { title: string; images: string[] }) {
    const [selected, setSelected] = useState('');
    const [zoom, setZoom] = useState(false);
    const image = images.includes(selected) ? selected : images[0];
    return <div>
        <button type="button" className={styles.main} onClick={() => setZoom(true)} title="Phóng to ảnh sách" aria-label="Phóng to ảnh sách" disabled={!image}>
            <BookCover src={image} title={title} /><ZoomIn className={styles.zoomIcon} size={20} />
        </button>
        <div className={styles.thumbnails}>{images.map((url, index) => <button type="button" key={url} aria-label={`Ảnh ${index + 1}`} aria-pressed={url === image} onClick={() => setSelected(url)}><BookCover src={url} title={`${title} - ảnh ${index + 1}`} /></button>)}</div>
        {zoom && <BookImagePreview src={image} title={title} onClose={() => setZoom(false)} />}
    </div>;
}

function BookImagePreview({ src, title, onClose }: { src?: string; title: string; onClose: () => void }) {
    const ref = useRef<HTMLDialogElement>(null);
    useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
    return <dialog ref={ref} className={styles.zoom} aria-label={title} onClick={event => { if (event.target === event.currentTarget) onClose(); }} onCancel={event => { event.preventDefault(); onClose(); }}>
        <button type="button" title="Đóng ảnh" onClick={onClose}><X /></button><BookCover src={src} title={title} className={styles.zoomImage} />
    </dialog>;
}

import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import styles from './BookCover.module.css';
import { normalizeBookImageUrl } from '../../utils/bookImageUrl';

export default function BookCover({ src, title, className = '' }: { src?: string; title: string; className?: string }) {
    const [failed, setFailed] = useState('');
    if (!src || failed === src) return <span className={`${styles.fallback} ${className}`} role="img" aria-label={title} title={title}><BookOpen size={32} /><span>{title}</span></span>;
    return <img src={normalizeBookImageUrl(src)} alt={title} className={className} onError={() => setFailed(src)} />;
}

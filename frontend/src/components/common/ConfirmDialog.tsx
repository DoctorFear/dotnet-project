import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import styles from './ConfirmDialog.module.css';

export default function ConfirmDialog({ title, message, busy, onClose, onConfirm, children }: { title: string; message: string; busy: boolean; onClose: () => void; onConfirm: () => void; children?: ReactNode }) {
    const ref = useRef<HTMLDialogElement>(null);
    useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
    return <dialog ref={ref} className={styles.dialog} aria-labelledby="confirm-title" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
        <button type="button" title="Đóng" disabled={busy} className={styles.close} onClick={onClose}><X size={18} /></button>
        <h2 id="confirm-title">{title}</h2><p>{message}</p>{children}
        <footer><button type="button" disabled={busy} onClick={onClose}>Hủy</button><button type="button" disabled={busy} onClick={onConfirm}>{busy ? 'Đang lưu...' : 'Xác nhận'}</button></footer>
    </dialog>;
}

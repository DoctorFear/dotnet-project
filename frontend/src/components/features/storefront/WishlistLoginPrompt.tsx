import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import styles from './WishlistLoginPrompt.module.css';

export default function WishlistLoginPrompt({ onClose, onLogin }: { onClose: () => void; onLogin: () => void }) {
    const ref = useRef<HTMLDialogElement>(null);
    useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
    return <dialog ref={ref} className={styles.dialog} onCancel={event => { event.preventDefault(); onClose(); }} aria-labelledby="wishlist-login-title">
        <button type="button" title="Đóng" className={styles.close} onClick={onClose}><X size={18} /></button>
        <h2 id="wishlist-login-title">Đăng nhập để lưu sách yêu thích</h2>
        <div className={styles.actions}><button type="button" onClick={onClose}>Để sau</button><button type="button" onClick={onLogin}>Đăng nhập</button></div>
    </dialog>;
}

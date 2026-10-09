import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { ShoppingCart, X } from 'lucide-react';
import { useBookPurchaseSelection } from '../../../hooks/useBookPurchaseSelection';
import type { BookPurchaseSelection, PurchasableBook } from '../../../types/bookPurchase';
import BookPurchaseOptions from './BookPurchaseOptions';
import styles from './BookPurchaseDialog.module.css';

interface BookPurchaseDialogProps {
    book: PurchasableBook;
    isSubmitting: boolean;
    children?: ReactNode;
    onClose: () => void;
    onConfirm: (book: PurchasableBook, selection: BookPurchaseSelection) => Promise<boolean>;
}

export default function BookPurchaseDialog({ book, isSubmitting, onClose, onConfirm, children }: BookPurchaseDialogProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const selection = useBookPurchaseSelection(book);
    useEffect(() => {
        const dialog = dialogRef.current;
        dialog?.showModal();
        return () => dialog?.close();
    }, []);
    return (
        <dialog ref={dialogRef} className={styles.dialog} aria-labelledby="purchase-title" onCancel={(event) => { event.preventDefault(); if (!isSubmitting) onClose(); }}>
            {children}
            <header className={styles.header}><h2 id="purchase-title">Thêm vào giỏ hàng</h2><button type="button" title="Đóng" aria-label="Đóng" disabled={isSubmitting} onClick={onClose}><X size={18} /></button></header>
            <div className={styles.body}>
                <h3>{book.title}</h3>
                <BookPurchaseOptions book={book} selection={selection} disabled={isSubmitting} />
                <div className={styles.total}><span>Thành tiền</span><strong>{(selection.price * (selection.format === 'physical' ? selection.quantity : 1)).toLocaleString('vi-VN')} đ</strong></div>
            </div>
            <footer className={styles.footer}>
                <button type="button" disabled={isSubmitting} onClick={onClose}>Hủy</button>
                <button type="button" className={styles.confirm} disabled={isSubmitting || selection.formats.length === 0 || (selection.format === 'rental' && selection.rentals.length === 0) || (selection.format === 'physical' && (book.stockCount ?? 0) < selection.quantity)} onClick={async () => { if (await onConfirm(book, selection)) onClose(); }}><ShoppingCart size={16} />{isSubmitting ? 'Đang thêm...' : 'Thêm vào giỏ'}</button>
            </footer>
        </dialog>
    );
}

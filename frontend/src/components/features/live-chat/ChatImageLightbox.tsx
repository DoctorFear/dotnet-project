import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './CustomerChatWidget.module.css';

interface ChatImageLightboxProps {
    imageUrl: string | null;
    onClose: () => void;
}

export const ChatImageLightbox: React.FC<ChatImageLightboxProps> = ({ imageUrl, onClose }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (imageUrl) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [imageUrl, onClose]);

    if (!imageUrl) return null;

    return (
        <div className={styles.lightboxModal} onClick={onClose} role="dialog" aria-modal="true">
            <button
                type="button"
                className={styles.lightboxClose}
                onClick={onClose}
                title="Đóng (Esc)"
            >
                <X size={22} />
            </button>
            <img
                src={imageUrl}
                alt="Hình ảnh phóng to"
                className={styles.lightboxContent}
                onClick={(e) => e.stopPropagation()}
            />
            <div className={styles.lightboxCaption}>Nhấn phím Esc hoặc bấm ra ngoài để đóng</div>
        </div>
    );
};

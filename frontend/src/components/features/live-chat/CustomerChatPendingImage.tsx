import React from 'react';
import { X } from 'lucide-react';
import styles from './CustomerChatWidget.module.css';

interface CustomerChatPendingImageProps {
    previewUrl: string;
    fileName: string;
    onRemove: () => void;
}

export const CustomerChatPendingImage: React.FC<CustomerChatPendingImageProps> = ({
    previewUrl,
    fileName,
    onRemove,
}) => {
    return (
        <div className={styles.pendingImgBar}>
            <div className={styles.pendingThumbBox}>
                <img src={previewUrl} alt="Ảnh chờ gửi" className={styles.pendingThumb} />
                <button
                    type="button"
                    className={styles.btnRemovePending}
                    onClick={onRemove}
                    title="Hủy ảnh này"
                >
                    <X size={12} />
                </button>
            </div>
            <div className={styles.pendingText}>
                Đính kèm: <b>{fileName}</b> (Bấm Gửi để hoàn tất)
            </div>
        </div>
    );
};

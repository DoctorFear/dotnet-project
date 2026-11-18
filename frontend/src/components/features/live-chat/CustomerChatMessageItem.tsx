import React from 'react';
import type { ChatMessageDto } from '../../../types/chat';
import styles from './CustomerChatWidget.module.css';

interface CustomerChatMessageItemProps {
    message: ChatMessageDto;
    isSelf: boolean;
    onImageClick: (url: string) => void;
}

export const CustomerChatMessageItem: React.FC<CustomerChatMessageItemProps> = ({
    message,
    isSelf,
    onImageClick,
}) => {
    const formattedTime = new Date(message.createdAt).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
    });

    const hasAttachment = !!message.attachmentUrl;
    const hasText = !!message.content && message.content.trim().length > 0;

    if (isSelf) {
        return (
            <div className={styles.msgOutgoing}>
                {hasAttachment && hasText ? (
                    <div className={styles.msgBubbleUserCombo}>
                        <img
                            src={message.attachmentUrl}
                            alt="Ảnh đính kèm"
                            className={styles.chatClickableImg}
                            onClick={() => message.attachmentUrl && onImageClick(message.attachmentUrl)}
                            title="Bấm để phóng to"
                        />
                        <div className={styles.msgBubbleText}>{message.content}</div>
                    </div>
                ) : hasAttachment ? (
                    <div className={styles.msgBubbleUserCombo}>
                        <img
                            src={message.attachmentUrl}
                            alt="Ảnh đính kèm"
                            className={styles.chatClickableImg}
                            onClick={() => message.attachmentUrl && onImageClick(message.attachmentUrl)}
                            title="Bấm để phóng to"
                        />
                    </div>
                ) : (
                    <div className={styles.msgBubbleUser}>{message.content}</div>
                )}
                <span className={styles.msgTime}>{formattedTime}</span>
            </div>
        );
    }

    // Tin nhắn từ Tư vấn viên (Incoming)
    return (
        <div className={styles.msgIncoming}>
            <div className={styles.msgAvatarSmall}>TV</div>
            <div className={styles.msgContent}>
                <div className={styles.msgSenderName}>Tư vấn viên</div>
                {hasAttachment && hasText ? (
                    <div className={styles.msgBubbleAgentCombo}>
                        <img
                            src={message.attachmentUrl}
                            alt="Ảnh từ tư vấn viên"
                            className={styles.chatClickableImg}
                            onClick={() => message.attachmentUrl && onImageClick(message.attachmentUrl)}
                            title="Bấm để phóng to"
                        />
                        <div className={styles.msgBubbleText}>{message.content}</div>
                    </div>
                ) : hasAttachment ? (
                    <div className={styles.msgBubbleAgentCombo}>
                        <img
                            src={message.attachmentUrl}
                            alt="Ảnh từ tư vấn viên"
                            className={styles.chatClickableImg}
                            onClick={() => message.attachmentUrl && onImageClick(message.attachmentUrl)}
                            title="Bấm để phóng to"
                        />
                    </div>
                ) : (
                    <div className={styles.msgBubbleAgent}>{message.content}</div>
                )}
                <span className={styles.msgTime}>{formattedTime}</span>
            </div>
        </div>
    );
};

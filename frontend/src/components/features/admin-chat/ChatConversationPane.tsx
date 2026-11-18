import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    CheckCircle,
    UserCheck,
    Share2,
    LogOut,
    Lock,
    Image as ImageIcon,
    Send,
    X,
    AlertCircle,
    MessageSquare,
} from 'lucide-react';
import type { StaffChatSessionDto, ChatTimelineItemDto, ChatMessageDto } from '../../../types/chat';
import styles from './StaffChatConsole.module.css';

interface ChatConversationPaneProps {
    session: StaffChatSessionDto | null;
    timeline: ChatTimelineItemDto[];
    currentStaffId: number;
    onAcceptSession: () => Promise<void>;
    onSendMessage: (content?: string, attachmentFile?: File) => Promise<void>;
    onOpenTransferModal: () => void;
    onOpenLeaveModal: () => void;
    onOpenCloseModal: () => void;
    onImageClick: (url: string) => void;
}

export const ChatConversationPane: React.FC<ChatConversationPaneProps> = ({
    session,
    timeline,
    currentStaffId,
    onAcceptSession,
    onSendMessage,
    onOpenTransferModal,
    onOpenLeaveModal,
    onOpenCloseModal,
    onImageClick,
}) => {
    const [inputText, setInputText] = useState<string>('');
    const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
    const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const streamBodyRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = useCallback(() => {
        if (streamBodyRef.current) {
            streamBodyRef.current.scrollTop = streamBodyRef.current.scrollHeight;
        }
    }, []);

    useEffect(() => {
        setTimeout(scrollToBottom, 60);
    }, [timeline, session?.id, scrollToBottom]);

    if (!session) {
        return (
            <div className={styles.chatStreamPanel}>
                <div className={styles.noSessionPlaceholder}>
                    <MessageSquare size={44} style={{ opacity: 0.3 }} />
                    <p>Chọn một phiên từ hàng đợi bên trái để bắt đầu hỗ trợ khách hàng.</p>
                </div>
            </div>
        );
    }

    const isPending = session.status === 'Pending' || session.status === 1;
    const isActive = session.status === 'Active' || session.status === 2;
    const isClosed = session.status === 'Closed' || session.status === 3;

    const isCurrentStaffOwner = session.staffId === currentStaffId;
    const isReadOnly = isActive && !isCurrentStaffOwner;
    const canSendMessages = isCurrentStaffOwner && isActive;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            setErrorMsg('Chỉ chấp nhận tệp hình ảnh (.jpg, .jpeg, .png, .webp).');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setErrorMsg('Dung lượng hình ảnh không được vượt quá 5MB.');
            return;
        }

        setErrorMsg(null);
        setPendingImageFile(file);
        setPendingImagePreview(URL.createObjectURL(file));

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemovePending = () => {
        if (pendingImagePreview) {
            URL.revokeObjectURL(pendingImagePreview);
        }
        setPendingImageFile(null);
        setPendingImagePreview(null);
        setErrorMsg(null);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = inputText.trim();
        if (!trimmed && !pendingImageFile) return;

        setIsSubmitting(true);
        setErrorMsg(null);

        try {
            await onSendMessage(trimmed || undefined, pendingImageFile || undefined);
            setInputText('');
            handleRemovePending();
            setTimeout(scrollToBottom, 40);
        } catch (err: any) {
            setErrorMsg(err.message || 'Lỗi gửi tin nhắn.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatTime = (timeStr?: string) => {
        if (!timeStr) return '';
        try {
            return new Date(timeStr).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return '';
        }
    };

    return (
        <section className={styles.chatStreamPanel}>
            {/* STREAM HEADER */}
            <header className={styles.streamHeader}>
                <div className={styles.customerLeadInfo}>
                    <div>
                        <div className={styles.custLeadName}>{session.customerName}</div>
                        <div className={styles.custLeadSub}>
                            Khách hàng #{session.customerId} •{' '}
                            {session.customerEmail || 'Chưa có email'}
                        </div>
                    </div>
                </div>

                <div className={styles.streamActions}>
                    {isPending && (
                        <button
                            type="button"
                            className={styles.btnAcceptSession}
                            onClick={onAcceptSession}
                        >
                            <UserCheck size={15} /> Tiếp nhận phiên
                        </button>
                    )}

                    {isActive && isCurrentStaffOwner && (
                        <>
                            <button
                                type="button"
                                className={styles.btnActionOutline}
                                onClick={onOpenTransferModal}
                            >
                                <Share2 size={13} /> Chuyển ca
                            </button>
                            <button
                                type="button"
                                className={styles.btnActionOutline}
                                onClick={onOpenLeaveModal}
                            >
                                <LogOut size={13} /> Rời phiên
                            </button>
                            <button
                                type="button"
                                className={styles.btnEndSession}
                                onClick={onOpenCloseModal}
                            >
                                <CheckCircle size={13} /> Kết thúc
                            </button>
                        </>
                    )}
                </div>
            </header>

            {/* BANNERS */}
            {isPending && (
                <div className={styles.claimBanner}>
                    <span>
                        <AlertCircle size={15} style={{ display: 'inline', marginRight: 6 }} />
                        Phiên chat này chưa có nhân sự tiếp nhận.
                    </span>
                    <button
                        type="button"
                        className={styles.btnAcceptSession}
                        style={{ padding: '4px 10px', fontSize: '11.5px' }}
                        onClick={onAcceptSession}
                    >
                        Tiếp nhận ngay
                    </button>
                </div>
            )}

            {isReadOnly && (
                <div className={styles.lockedSessionBanner}>
                    <Lock size={15} />
                    <span>
                        Phiên chat do <b>{session.staffName || 'nhân viên khác'}</b> phụ trách. Bạn đang ở chế độ xem (Read-only).
                    </span>
                </div>
            )}

            {/* TIMELINE MESSAGES */}
            <div className={styles.streamBody} ref={streamBodyRef}>
                {timeline.map((item, index) => {
                    if (item.itemType === 'Event' && item.event) {
                        return (
                            <div key={`evt-${item.event.id || index}`} className={styles.streamSystemEvent}>
                                <CheckCircle size={13} />
                                {item.event.eventDescription || item.event.note || 'Sự kiện hệ thống'}
                            </div>
                        );
                    }

                    if (item.message) {
                        const msg: ChatMessageDto = item.message;
                        // Phân biệt khách vs nhân viên
                        const isCustomer =
                            msg.senderRole === 1 ||
                            msg.senderRole === 'Member' ||
                            (msg.senderId === session.customerId && msg.senderRole !== 2 && msg.senderRole !== 'Staff');
                        const hasImg = !!msg.attachmentUrl;
                        const hasTxt = !!msg.content && msg.content.trim().length > 0;

                        if (isCustomer) {
                            return (
                                <div key={`msg-${msg.id || index}`} className={styles.msgIncoming}>
                                    <div className={styles.msgAvatarSmall}>KH</div>
                                    <div className={styles.msgContent}>
                                        <div className={styles.msgSenderName}>{session.customerName}</div>
                                        {hasImg && hasTxt ? (
                                            <div className={styles.msgBubbleCustomerCombo}>
                                                <img
                                                    src={msg.attachmentUrl}
                                                    alt="Ảnh từ khách"
                                                    className={styles.chatClickableImg}
                                                    onClick={() => msg.attachmentUrl && onImageClick(msg.attachmentUrl)}
                                                />
                                                <div className={styles.msgBubbleText}>{msg.content}</div>
                                            </div>
                                        ) : hasImg ? (
                                            <div className={styles.msgBubbleCustomerCombo}>
                                                <img
                                                    src={msg.attachmentUrl}
                                                    alt="Ảnh từ khách"
                                                    className={styles.chatClickableImg}
                                                    onClick={() => msg.attachmentUrl && onImageClick(msg.attachmentUrl)}
                                                />
                                            </div>
                                        ) : (
                                            <div className={styles.msgBubbleCustomer}>{msg.content}</div>
                                        )}
                                        <span className={styles.msgTime}>{formatTime(msg.createdAt)}</span>
                                    </div>
                                </div>
                            );
                        }

                        // Tin nhắn từ nhân viên (Outgoing)
                        return (
                            <div key={`msg-${msg.id || index}`} className={styles.msgOutgoing}>
                                {hasImg && hasTxt ? (
                                    <div className={styles.msgBubbleStaffCombo}>
                                        <img
                                            src={msg.attachmentUrl}
                                            alt="Ảnh phản hồi"
                                            className={styles.chatClickableImg}
                                            onClick={() => msg.attachmentUrl && onImageClick(msg.attachmentUrl)}
                                        />
                                        <div className={styles.msgBubbleText}>{msg.content}</div>
                                    </div>
                                ) : hasImg ? (
                                    <div className={styles.msgBubbleStaffCombo}>
                                        <img
                                            src={msg.attachmentUrl}
                                            alt="Ảnh phản hồi"
                                            className={styles.chatClickableImg}
                                            onClick={() => msg.attachmentUrl && onImageClick(msg.attachmentUrl)}
                                        />
                                    </div>
                                ) : (
                                    <div className={styles.msgBubbleStaff}>{msg.content}</div>
                                )}
                                <span className={styles.msgTime}>
                                    {msg.senderName || 'Bạn'} • {formatTime(msg.createdAt)}
                                </span>
                            </div>
                        );
                    }

                    return null;
                })}
            </div>

            {/* FOOTER NHẬP LIỆU */}
            <div className={styles.streamFooterWrapper}>
                {errorMsg && (
                    <div style={{ color: '#ef4444', fontSize: '12px', padding: '6px 16px', background: '#fee2e2' }}>
                        {errorMsg}
                    </div>
                )}

                {canSendMessages ? (
                    <>
                        {pendingImagePreview && pendingImageFile && (
                            <div className={styles.pendingImgBar}>
                                <div className={styles.pendingThumbBox}>
                                    <img src={pendingImagePreview} alt="Xem trước ảnh" className={styles.pendingThumb} />
                                    <button
                                        type="button"
                                        className={styles.btnRemovePending}
                                        onClick={handleRemovePending}
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                                <div className={styles.pendingText}>
                                    Ảnh đính kèm: <b>{pendingImageFile.name}</b>
                                </div>
                            </div>
                        )}

                        <form className={styles.streamInputForm} onSubmit={handleSend}>
                            <button
                                type="button"
                                className={styles.btnAttachImg}
                                onClick={() => fileInputRef.current?.click()}
                                title="Đính kèm hình ảnh (tối đa 5MB)"
                                disabled={isSubmitting}
                            >
                                <ImageIcon size={18} />
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png, image/jpeg, image/jpg, image/webp"
                                className={styles.hiddenFileInput}
                                onChange={handleFileSelect}
                            />

                            <input
                                type="text"
                                className={styles.streamInput}
                                placeholder="Nhập câu trả lời tư vấn cho khách hàng... (Enter để gửi)"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                disabled={isSubmitting}
                            />

                            <button
                                type="submit"
                                className={styles.btnSendReply}
                                disabled={isSubmitting || (!inputText.trim() && !pendingImageFile)}
                            >
                                <Send size={15} />
                                Gửi
                            </button>
                        </form>
                    </>
                ) : isClosed ? (
                    <div className={styles.closedBanner}>
                        Phiên hỗ trợ này đã được kết thúc. Khung trò chuyện chuyển sang trạng thái lưu trữ.
                    </div>
                ) : isPending ? (
                    <div className={styles.readonlyLockedBox}>
                        <span>Vui lòng nhấn &ldquo;Tiếp nhận phiên&rdquo; để bắt đầu phản hồi cho khách hàng.</span>
                    </div>
                ) : (
                    <div className={styles.readonlyLockedBox}>
                        <Lock size={16} />
                        <span>Chỉ nhân viên phụ trách mới có quyền gửi tin nhắn trong phiên này.</span>
                    </div>
                )}
            </div>
        </section>
    );
};

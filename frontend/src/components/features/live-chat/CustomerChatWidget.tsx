import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageSquare, X, Image as ImageIcon, Send } from 'lucide-react';
import { useUser } from '../../../context/UserContext';
import { chatService } from '../../../services/chatService';
import { chatHubService } from '../../../services/chatHubService';
import type { CustomerChatSessionDto, ChatTimelineItemDto, ChatMessageDto } from '../../../types/chat';
import { CustomerChatMessageItem } from './CustomerChatMessageItem';
import { CustomerChatPendingImage } from './CustomerChatPendingImage';
import { CustomerChatLoginNotice } from './CustomerChatLoginNotice';
import { ChatImageLightbox } from './ChatImageLightbox';
import styles from './CustomerChatWidget.module.css';

export const CustomerChatWidget: React.FC = () => {
    const { isLoggedIn } = useUser();
    const location = useLocation();

    // Ẩn widget ở các trang Admin / Staff / Shipper / Reader
    const pathname = location.pathname.toLowerCase();
    const isExcludedPage =
        pathname.startsWith('/admin') ||
        pathname.startsWith('/staff') ||
        pathname.startsWith('/shipper') ||
        pathname.startsWith('/reader');

    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [loginNoticeOpen, setLoginNoticeOpen] = useState<boolean>(false);
    const [session, setSession] = useState<CustomerChatSessionDto | null>(null);
    const [timeline, setTimeline] = useState<ChatTimelineItemDto[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);

    const [inputText, setInputText] = useState<string>('');
    const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
    const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [isSending, setIsSending] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

    const chatBodyRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Tự động cuộn xuống đáy khi tin nhắn mới xuất hiện
    const scrollToBottom = useCallback(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, []);

    // Tải thông tin phiên chat của khách hàng
    const loadSession = useCallback(async () => {
        if (!isLoggedIn) return;
        try {
            const data = await chatService.getMySession();
            setSession(data);
            setTimeline(data.timeline || []);
            setUnreadCount(data.unreadMessagesCount || 0);

            // Tham gia room SignalR của phiên
            if (data.id) {
                await chatHubService.joinSessionRoom(data.id);
            }
        } catch (err) {
            console.warn('[LiveChat] Không thể tải phiên chat khách hàng:', err);
        }
    }, [isLoggedIn]);

    // Khởi tạo và đồng bộ khi user đăng nhập
    useEffect(() => {
        if (isLoggedIn) {
            loadSession();
        } else {
            setSession(null);
            setTimeline([]);
            setUnreadCount(0);
        }
    }, [isLoggedIn, loadSession]);

    // Lắng nghe SignalR các sự kiện phòng chat
    useEffect(() => {
        if (!isLoggedIn || !session?.id) return;

        const unsubscribeReceive = chatHubService.onReceiveMessage((message: ChatMessageDto) => {
            if (message.chatSessionId === session.id) {
                setTimeline((prev) => {
                    const exists = prev.some((item) => item.message?.id === message.id);
                    if (exists) return prev;
                    return [
                        ...prev,
                        {
                            itemType: 'Message',
                            timestamp: message.createdAt,
                            message,
                        },
                    ];
                });

                if (isOpen) {
                    chatService.markAsReadByCustomer(session.id).catch(() => {});
                } else {
                    setUnreadCount((prev) => prev + 1);
                }
                setTimeout(scrollToBottom, 50);
            }
        });

        const unsubscribeAccepted = chatHubService.onSessionAccepted((event) => {
            if (event.chatSessionId === session.id) {
                setSession((prev) => (prev ? { ...prev, hasAssignedStaff: true } : null));
                setTimeline((prev) => [
                    ...prev,
                    {
                        itemType: 'Event',
                        timestamp: event.createdAt,
                        event,
                    },
                ]);
                setTimeout(scrollToBottom, 50);
            }
        });

        const unsubscribeClosed = chatHubService.onSessionClosed((event) => {
            if (event.chatSessionId === session.id) {
                setSession((prev) => (prev ? { ...prev, status: 'Closed' } : null));
                setTimeline((prev) => [
                    ...prev,
                    {
                        itemType: 'Event',
                        timestamp: event.createdAt,
                        event,
                    },
                ]);
                setTimeout(scrollToBottom, 50);
            }
        });

        return () => {
            unsubscribeReceive();
            unsubscribeAccepted();
            unsubscribeClosed();
        };
    }, [isLoggedIn, session?.id, isOpen, scrollToBottom]);

    // Cuộn xuống khi mở widget
    useEffect(() => {
        if (isOpen) {
            setTimeout(scrollToBottom, 60);
        }
    }, [isOpen, scrollToBottom]);

    // Xử lý bật/tắt widget
    const handleToggle = () => {
        if (!isLoggedIn) {
            setLoginNoticeOpen((prev) => !prev);
            return;
        }

        const nextOpen = !isOpen;
        setIsOpen(nextOpen);
        if (nextOpen && session?.id) {
            setUnreadCount(0);
            chatService.markAsReadByCustomer(session.id).catch(() => {});
        }
    };

    // Chọn ảnh từ máy tính (BR04: <= 5MB, định dạng ảnh)
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            setErrorMessage('Chỉ chấp nhận tệp hình ảnh (.jpg, .jpeg, .png, .webp).');
            return;
        }

        const maxSizeBytes = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSizeBytes) {
            setErrorMessage('Dung lượng hình ảnh không vượt quá 5MB.');
            return;
        }

        setErrorMessage(null);
        setPendingImageFile(file);
        setPendingImagePreview(URL.createObjectURL(file));

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemovePendingImage = () => {
        if (pendingImagePreview) {
            URL.revokeObjectURL(pendingImagePreview);
        }
        setPendingImageFile(null);
        setPendingImagePreview(null);
        setErrorMessage(null);
    };

    // Gửi tin nhắn
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session?.id) return;

        const trimmed = inputText.trim();
        if (!trimmed && !pendingImageFile) return;

        setIsSending(true);
        setErrorMessage(null);

        try {
            let uploadedUrl: string | undefined = undefined;

            if (pendingImageFile) {
                setIsUploading(true);
                const uploadRes = await chatService.uploadCustomerAttachment(pendingImageFile);
                uploadedUrl = uploadRes.url;
                setIsUploading(false);
            }

            const messageDto = await chatService.sendCustomerMessage(session.id, {
                content: trimmed || undefined,
                attachmentUrl: uploadedUrl,
            });

            // Optimistic update timeline
            setTimeline((prev) => {
                const exists = prev.some((item) => item.message?.id === messageDto.id);
                if (exists) return prev;
                return [
                    ...prev,
                    {
                        itemType: 'Message',
                        timestamp: messageDto.createdAt,
                        message: messageDto,
                    },
                ];
            });

            setInputText('');
            handleRemovePendingImage();
            setTimeout(scrollToBottom, 40);
        } catch (err: any) {
            setErrorMessage(err.message || 'Không thể gửi tin nhắn. Vui lòng thử lại.');
        } finally {
            setIsSending(false);
            setIsUploading(false);
        }
    };

    if (isExcludedPage) {
        return null;
    }

    return (
        <div className={styles.chatContainer}>
            {/* Pop-up thông báo khi khách vãng lai nhấn chat */}
            {loginNoticeOpen && !isLoggedIn && (
                <CustomerChatLoginNotice onClose={() => setLoginNoticeOpen(false)} />
            )}

            {/* Lightbox phóng to ảnh */}
            <ChatImageLightbox imageUrl={lightboxUrl} onClose={() => setLightboxUrl(null)} />

            {/* Bong bóng nổi Launcher (Ẩn khi mở cửa sổ) */}
            {!isOpen && (
                <button
                    type="button"
                    className={styles.chatLauncherBtn}
                    onClick={handleToggle}
                    title="Trò chuyện với ancientBOOK"
                    aria-label="Mở cửa sổ Live Chat"
                >
                    <MessageSquare size={26} />
                    {unreadCount > 0 && <span className={styles.unreadDot} />}
                </button>
            )}

            {/* Cửa sổ Khung trò chuyện */}
            {isOpen && (
                <div className={styles.chatWidgetWindow}>
                    {/* Header */}
                    <div className={styles.chatHeader}>
                        <div className={styles.headerAgent}>
                            <div>
                                <div className={styles.brandName}>
                                    ancient<span className={styles.bookText}>BOOK</span>
                                    <span className={styles.accentDot}></span>
                                </div>
                                <div className={styles.agentStatus}>
                                    <span className={styles.statusIndicator} />
                                    <span>
                                        {session?.hasAssignedStaff
                                            ? 'Tư vấn viên đang trực tuyến'
                                            : 'Hàng đợi tư vấn trực tuyến'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            className={styles.btnCloseHeader}
                            onClick={() => setIsOpen(false)}
                            title="Thu nhỏ khung chat"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className={styles.chatBody} ref={chatBodyRef}>
                        {/* Timeline các tin nhắn trao đổi từ Database */}
                        {timeline.map((item, index) => {
                            if (item.itemType === 'Event' && item.event) {
                                return (
                                    <div key={`event-${item.event.id || index}`} className={styles.systemEventBubble}>
                                        {item.event.eventDescription || item.event.note || 'Sự kiện hệ thống'}
                                    </div>
                                );
                            }

                            if (item.message) {
                                const isSelf =
                                    item.message.senderRole === 1 ||
                                    item.message.senderRole === 'Member' ||
                                    item.message.senderName === 'Bạn';
                                return (
                                    <CustomerChatMessageItem
                                        key={`msg-${item.message.id || index}`}
                                        message={item.message}
                                        isSelf={isSelf}
                                        onImageClick={(url) => setLightboxUrl(url)}
                                    />
                                );
                            }

                            return null;
                        })}
                    </div>

                    {/* Footer thanh nhập tin nhắn */}
                    <div className={styles.chatFooterWrapper}>
                        {errorMessage && (
                            <div style={{ color: '#ef4444', fontSize: '11px', padding: '4px 12px', background: '#fee2e2' }}>
                                {errorMessage}
                            </div>
                        )}

                        {pendingImagePreview && pendingImageFile && (
                            <CustomerChatPendingImage
                                previewUrl={pendingImagePreview}
                                fileName={pendingImageFile.name}
                                onRemove={handleRemovePendingImage}
                            />
                        )}

                        <form className={styles.chatFooter} onSubmit={handleSendMessage}>
                            <button
                                type="button"
                                className={styles.btnAttachImg}
                                onClick={() => fileInputRef.current?.click()}
                                title="Đính kèm hình ảnh (tối đa 5MB)"
                                disabled={isSending || isUploading}
                            >
                                <ImageIcon size={17} />
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
                                className={styles.chatInput}
                                placeholder="Nhập câu hỏi hoặc lời nhắn..."
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                disabled={isSending || isUploading}
                            />

                            <button
                                type="submit"
                                className={styles.btnSend}
                                disabled={isSending || isUploading || (!inputText.trim() && !pendingImageFile)}
                            >
                                <Send size={15} />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '../../../context/UserContext';
import { chatService } from '../../../services/chatService';
import { chatHubService } from '../../../services/chatHubService';
import type {
    StaffChatSessionDto,
    ChatSessionStatus,
    ChatTimelineItemDto,
    ChatMessageDto,
} from '../../../types/chat';
import { ChatQueueSidebar } from './ChatQueueSidebar';
import { ChatConversationPane } from './ChatConversationPane';
import { ChatCustomerInfoSidebar } from './ChatCustomerInfoSidebar';
import { TransferSessionModal } from './TransferSessionModal';
import { ConfirmActionModal } from './ConfirmActionModal';
import { ChatImageLightbox } from '../live-chat/ChatImageLightbox';
import styles from './StaffChatConsole.module.css';

export const StaffChatConsole: React.FC = () => {
    const { user } = useUser();
    const currentStaffId = user?.id || 0;

    // State Hàng đợi (Cột 1)
    const [sessions, setSessions] = useState<StaffChatSessionDto[]>([]);
    const [activeTab, setActiveTab] = useState<ChatSessionStatus>('Pending');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // State Phiên được chọn & Timeline (Cột 2)
    const [activeSession, setActiveSession] = useState<StaffChatSessionDto | null>(null);
    const [timeline, setTimeline] = useState<ChatTimelineItemDto[]>([]);

    // Modals
    const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState<boolean>(false);
    const [isCloseModalOpen, setIsCloseModalOpen] = useState<boolean>(false);
    const [isSubmittingAction, setIsSubmittingAction] = useState<boolean>(false);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

    // Toasts / alerts
    const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);

    const activeSessionRef = useRef<StaffChatSessionDto | null>(null);
    activeSessionRef.current = activeSession;

    const showToast = (text: string, type: 'success' | 'error' | 'warning' = 'success') => {
        setToastMessage({ text, type });
        setTimeout(() => setToastMessage(null), 3500);
    };

    // Tải danh sách hàng đợi theo tab
    const loadQueue = useCallback(async (status: ChatSessionStatus) => {
        try {
            const res = await chatService.getStaffQueue({
                status,
                pageNumber: 1,
                pageSize: 50,
            });
            setSessions(res.items || []);
        } catch (err: any) {
            console.warn('[LiveChatConsole] Lỗi tải hàng đợi:', err);
        }
    }, []);

    // Tải chi tiết phiên được chọn
    const loadSessionDetail = useCallback(async (sessionId: number) => {
        try {
            const res = await chatService.getStaffSessionDetail(sessionId);
            setActiveSession(res.session);
            setTimeline(res.timeline || []);

            // Gia nhập phòng chat phiên đó trên Hub
            await chatHubService.joinSessionRoom(sessionId);
        } catch (err: any) {
            showToast(err.message || 'Không thể tải chi tiết phiên.', 'error');
        }
    }, []);

    // Khởi tạo và load queue
    useEffect(() => {
        loadQueue(activeTab);
    }, [activeTab, loadQueue]);

    // Bắt đầu kết nối SignalR Hub khi vào trang
    useEffect(() => {
        chatHubService.start();

        // 1. Khi có tin nhắn mới từ khách trong hàng đợi -> Cập nhật preview & unread hoặc tải lại nếu là phiên mới
        const unsubQueueMsg = chatHubService.onQueueMessageReceived((sessionId, previewText) => {
            setSessions((prev) => {
                const exists = prev.some((s) => s.id === sessionId);
                if (!exists) {
                    loadQueue(activeTab);
                    return prev;
                }
                return prev.map((s) =>
                    s.id === sessionId
                        ? {
                              ...s,
                              lastMessagePreview: previewText,
                              lastActivityAt: new Date().toISOString(),
                              unreadCount: s.id === activeSessionRef.current?.id ? s.unreadCount : s.unreadCount + 1,
                          }
                        : s
                );
            });
        });

        // 2. Khi phiên được nhân viên khác tiếp nhận
        const unsubQueueAccepted = chatHubService.onQueueSessionAccepted((sessionId, staffId) => {
            if (activeTab === 'Pending') {
                // Phiên biến mất khỏi tab Chờ
                setSessions((prev) => prev.filter((s) => s.id !== sessionId));
            } else if (activeTab === 'Active') {
                // Tải lại để cập nhật phiên mới vào tab Active
                loadQueue('Active');
            }

            if (activeSessionRef.current?.id === sessionId) {
                setActiveSession((prev) => (prev ? { ...prev, status: 2, staffId } : null));
            }
        });

        // 3. Khi phiên được cập nhật (ví dụ chuyển ca)
        const unsubQueueUpdated = chatHubService.onQueueSessionUpdated((sessionId) => {
            loadQueue(activeTab);
            if (activeSessionRef.current?.id === sessionId) {
                loadSessionDetail(sessionId);
            }
        });

        // 4. Khi nhân viên rời phiên -> quay về tab Pending
        const unsubQueueReverted = chatHubService.onQueueSessionRevertedToPending((sessionId) => {
            loadQueue(activeTab);
            if (activeSessionRef.current?.id === sessionId) {
                setActiveSession((prev) => (prev ? { ...prev, status: 'Pending', staffId: undefined } : null));
            }
        });

        // 5. Khi phiên bị đóng
        const unsubQueueClosed = chatHubService.onQueueSessionClosed((sessionId) => {
            if (activeTab !== 'Closed') {
                setSessions((prev) => prev.filter((s) => s.id !== sessionId));
            }
            if (activeSessionRef.current?.id === sessionId) {
                setActiveSession((prev) => (prev ? { ...prev, status: 'Closed' } : null));
            }
        });

        // 6. Nhận tin nhắn trong phòng phiên đang mở
        const unsubReceiveMsg = chatHubService.onReceiveMessage((message: ChatMessageDto) => {
            if (activeSessionRef.current?.id === message.chatSessionId) {
                setTimeline((prev) => {
                    const exists = prev.some((it) => it.message?.id === message.id);
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
            }
        });

        // 7. Nhận sự kiện phòng
        const unsubSessionAccepted = chatHubService.onSessionAccepted((evt) => {
            if (activeSessionRef.current?.id === evt.chatSessionId) {
                setTimeline((prev) => [
                    ...prev,
                    {
                        itemType: 'Event',
                        timestamp: evt.createdAt,
                        event: evt,
                    },
                ]);
            }
        });

        const unsubSessionTransferred = chatHubService.onSessionTransferred((evt) => {
            if (activeSessionRef.current?.id === evt.chatSessionId) {
                setTimeline((prev) => [
                    ...prev,
                    {
                        itemType: 'Event',
                        timestamp: evt.createdAt,
                        event: evt,
                    },
                ]);
            }
        });

        const unsubSessionLeft = chatHubService.onSessionLeft((evt) => {
            if (activeSessionRef.current?.id === evt.chatSessionId) {
                setTimeline((prev) => [
                    ...prev,
                    {
                        itemType: 'Event',
                        timestamp: evt.createdAt,
                        event: evt,
                    },
                ]);
            }
        });

        const unsubSessionClosed = chatHubService.onSessionClosed((evt) => {
            if (activeSessionRef.current?.id === evt.chatSessionId) {
                setTimeline((prev) => [
                    ...prev,
                    {
                        itemType: 'Event',
                        timestamp: evt.createdAt,
                        event: evt,
                    },
                ]);
            }
        });

        return () => {
            unsubQueueMsg();
            unsubQueueAccepted();
            unsubQueueUpdated();
            unsubQueueReverted();
            unsubQueueClosed();
            unsubReceiveMsg();
            unsubSessionAccepted();
            unsubSessionTransferred();
            unsubSessionLeft();
            unsubSessionClosed();
        };
    }, [activeTab, loadQueue, loadSessionDetail]);

    // Chọn phiên từ Cột 1
    const handleSelectSession = (session: StaffChatSessionDto) => {
        // Rời phòng cũ nếu có
        if (activeSession?.id && activeSession.id !== session.id) {
            chatHubService.leaveSessionRoom(activeSession.id);
        }
        loadSessionDetail(session.id);
    };

    // Hành động Tiếp nhận phiên (UC24 Bước 3, 4, 5 & E1 Xung đột)
    const handleAcceptSession = async () => {
        if (!activeSession) return;
        try {
            const eventDto = await chatService.acceptSession(activeSession.id);
            showToast('Tiếp nhận phiên hỗ trợ thành công!', 'success');

            // Cập nhật trạng thái phiên
            setActiveSession((prev) =>
                prev ? { ...prev, status: 2, staffId: currentStaffId, staffName: user?.fullName } : null
            );

            // Thêm event vào timeline
            setTimeline((prev) => [
                ...prev,
                {
                    itemType: 'Event',
                    timestamp: eventDto.createdAt,
                    event: eventDto,
                },
            ]);

            // Cập nhật lại danh sách hàng đợi
            loadQueue(activeTab);
        } catch (err: any) {
            // E1 UC24: Xung đột khi có người nhận trước (409 Conflict)
            showToast(err.message || 'Phiên chat đã được nhận bởi nhân viên khác.', 'error');
            loadQueue(activeTab);
            if (activeSession) {
                loadSessionDetail(activeSession.id);
            }
        }
    };

    // Gửi tin nhắn phản hồi từ nhân viên
    const handleSendMessage = async (content?: string, attachmentFile?: File) => {
        if (!activeSession) return;

        let attachmentUrl: string | undefined = undefined;
        if (attachmentFile) {
            const uploadRes = await chatService.uploadStaffAttachment(attachmentFile);
            attachmentUrl = uploadRes.url;
        }

        const msgDto = await chatService.sendStaffMessage(activeSession.id, {
            content,
            attachmentUrl,
        });

        // Optimistic update timeline
        setTimeline((prev) => {
            const exists = prev.some((it) => it.message?.id === msgDto.id);
            if (exists) return prev;
            return [
                ...prev,
                {
                    itemType: 'Message',
                    timestamp: msgDto.createdAt,
                    message: msgDto,
                },
            ];
        });
    };

    // Lưu ghi chú nội bộ (Cột 3)
    const handleSaveNote = async (note: string) => {
        if (!activeSession) return;
        try {
            await chatService.updateInternalNote(activeSession.id, { internalNote: note });
            setActiveSession((prev) => (prev ? { ...prev, internalNote: note } : null));
            showToast('Đã lưu ghi chú nội bộ.', 'success');
        } catch (err: any) {
            showToast(err.message || 'Lỗi lưu ghi chú nội bộ.', 'error');
            throw err;
        }
    };

    // Chuyển ca trực (Luồng A2)
    const handleConfirmTransfer = async (targetStaffId: number, note?: string) => {
        if (!activeSession) return;
        try {
            const eventDto = await chatService.transferSession(activeSession.id, {
                targetStaffId,
                note,
            });
            showToast('Đã chuyển giao phiên hỗ trợ thành công!', 'success');
            setTimeline((prev) => [
                ...prev,
                {
                    itemType: 'Event',
                    timestamp: eventDto.createdAt,
                    event: eventDto,
                },
            ]);
            loadQueue(activeTab);
            loadSessionDetail(activeSession.id);
        } catch (err: any) {
            showToast(err.message || 'Chuyển giao phiên thất bại.', 'error');
            throw err;
        }
    };

    // Rời phiên (Luồng A3)
    const handleConfirmLeave = async () => {
        if (!activeSession) return;
        setIsSubmittingAction(true);
        try {
            const eventDto = await chatService.leaveSession(activeSession.id);
            showToast('Đã rời phiên. Phiên đã được đưa về hàng đợi chung.', 'warning');
            setIsLeaveModalOpen(false);
            setTimeline((prev) => [
                ...prev,
                {
                    itemType: 'Event',
                    timestamp: eventDto.createdAt,
                    event: eventDto,
                },
            ]);
            loadQueue(activeTab);
            loadSessionDetail(activeSession.id);
        } catch (err: any) {
            showToast(err.message || 'Lỗi rời phiên.', 'error');
        } finally {
            setIsSubmittingAction(false);
        }
    };

    // Kết thúc phiên (Luồng A4)
    const handleConfirmClose = async () => {
        if (!activeSession) return;
        setIsSubmittingAction(true);
        try {
            const eventDto = await chatService.closeSession(activeSession.id);
            showToast('Phiên hỗ trợ đã được kết thúc thành công.', 'success');
            setIsCloseModalOpen(false);
            setActiveSession((prev) => (prev ? { ...prev, status: 3 } : null));
            setTimeline((prev) => [
                ...prev,
                {
                    itemType: 'Event',
                    timestamp: eventDto.createdAt,
                    event: eventDto,
                },
            ]);
            loadQueue(activeTab);
        } catch (err: any) {
            showToast(err.message || 'Lỗi đóng phiên.', 'error');
        } finally {
            setIsSubmittingAction(false);
        }
    };

    return (
        <div className={styles.chatWorkspace}>
            {/* TOAST THÔNG BÁO TỔNG QUAN */}
            {toastMessage && (
                <div
                    style={{
                        position: 'fixed',
                        top: 24,
                        right: 24,
                        zIndex: 3000,
                        padding: '10px 18px',
                        borderRadius: 8,
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '13px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                        background:
                            toastMessage.type === 'error'
                                ? '#d93838'
                                : toastMessage.type === 'warning'
                                ? '#b45309'
                                : '#15803d',
                    }}
                >
                    {toastMessage.text}
                </div>
            )}

            {/* LIGHTBOX PHÓNG TO HÌNH ẢNH */}
            <ChatImageLightbox imageUrl={lightboxUrl} onClose={() => setLightboxUrl(null)} />

            {/* MODAL CHUYỂN PHIÊN (A2) */}
            <TransferSessionModal
                isOpen={isTransferModalOpen}
                customerName={activeSession?.customerName || 'Khách hàng'}
                currentStaffId={currentStaffId}
                onClose={() => setIsTransferModalOpen(false)}
                onConfirm={handleConfirmTransfer}
            />

            {/* MODAL RỜI PHIÊN (A3) */}
            <ConfirmActionModal
                isOpen={isLeaveModalOpen}
                title="Xác nhận rời phiên hỗ trợ"
                message={
                    <>
                        Bạn có chắc chắn muốn rời phiên hỗ trợ của khách hàng <b>{activeSession?.customerName}</b>?
                        Phiên chat sẽ được đưa quay lại <b>Hàng đợi Đang chờ</b> để đồng nghiệp khác tiếp nhận.
                    </>
                }
                confirmText="Rời phiên ngay"
                confirmButtonVariant="primary"
                isSubmitting={isSubmittingAction}
                onClose={() => setIsLeaveModalOpen(false)}
                onConfirm={handleConfirmLeave}
            />

            {/* MODAL KẾT THÚC PHIÊN (A4) */}
            <ConfirmActionModal
                isOpen={isCloseModalOpen}
                title="Xác nhận kết thúc phiên hỗ trợ"
                message={
                    <>
                        Khách hàng <b>{activeSession?.customerName}</b> đã được giải đáp đầy đủ?
                        Khi kết thúc, khung chat sẽ được chuyển sang trạng thái lưu trữ đóng phiên.
                    </>
                }
                confirmText="Kết thúc phiên"
                confirmButtonVariant="danger"
                isSubmitting={isSubmittingAction}
                onClose={() => setIsCloseModalOpen(false)}
                onConfirm={handleConfirmClose}
            />

            {/* CỘT 1: HÀNG ĐỢI PHIÊN CHAT */}
            <ChatQueueSidebar
                sessions={sessions}
                activeSessionId={activeSession?.id || null}
                activeTab={activeTab}
                searchQuery={searchQuery}
                onTabChange={(tab) => {
                    setActiveTab(tab);
                    setSearchQuery('');
                }}
                onSearchChange={setSearchQuery}
                onSelectSession={handleSelectSession}
            />

            {/* CỘT 2: KHUNG CHAT TRỰC TIẾP */}
            <ChatConversationPane
                session={activeSession}
                timeline={timeline}
                currentStaffId={currentStaffId}
                onAcceptSession={handleAcceptSession}
                onSendMessage={handleSendMessage}
                onOpenTransferModal={() => setIsTransferModalOpen(true)}
                onOpenLeaveModal={() => setIsLeaveModalOpen(true)}
                onOpenCloseModal={() => setIsCloseModalOpen(true)}
                onImageClick={(url) => setLightboxUrl(url)}
            />

            {/* CỘT 3: THÔNG TIN KHÁCH HÀNG & GHI CHÚ NỘI BỘ */}
            <ChatCustomerInfoSidebar
                session={activeSession}
                isCurrentStaffOwner={activeSession?.staffId === currentStaffId}
                onSaveNote={handleSaveNote}
                onOpenTransferModal={() => setIsTransferModalOpen(true)}
                onOpenLeaveModal={() => setIsLeaveModalOpen(true)}
                onOpenCloseModal={() => setIsCloseModalOpen(true)}
            />
        </div>
    );
};

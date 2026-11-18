import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, ShieldCheck, Share2, LogOut, CheckCircle } from 'lucide-react';
import type { StaffChatSessionDto } from '../../../types/chat';
import styles from './StaffChatConsole.module.css';

interface ChatCustomerInfoSidebarProps {
    session: StaffChatSessionDto | null;
    isCurrentStaffOwner: boolean;
    onSaveNote: (note: string) => Promise<void>;
    onOpenTransferModal: () => void;
    onOpenLeaveModal: () => void;
    onOpenCloseModal: () => void;
}

export const ChatCustomerInfoSidebar: React.FC<ChatCustomerInfoSidebarProps> = ({
    session,
    isCurrentStaffOwner,
    onSaveNote,
    onOpenTransferModal,
    onOpenLeaveModal,
    onOpenCloseModal,
}) => {
    const [note, setNote] = useState<string>('');
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

    useEffect(() => {
        setNote(session?.internalNote || '');
        setSavedSuccess(false);
    }, [session?.id, session?.internalNote]);

    if (!session) {
        return (
            <aside className={styles.customerDetailsPanel}>
                <div className={styles.detailCard}>
                    <div className={styles.cardHeading}>
                        <span>Hồ sơ khách hàng</span>
                    </div>
                    <div style={{ textAlign: 'center', color: '#5b6e99', fontSize: '12.5px', padding: '16px 0' }}>
                        Chọn một phiên chat từ danh sách để xem thông tin chi tiết.
                    </div>
                </div>
            </aside>
        );
    }

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSaveNote(note);
            setSavedSuccess(true);
            setTimeout(() => setSavedSuccess(false), 2500);
        } catch {
            // Error handling in parent
        } finally {
            setIsSaving(false);
        }
    };

    const getInitials = (name: string) => {
        if (!name) return 'KH';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const formatDateTime = (dateStr?: string) => {
        if (!dateStr) return '—';
        try {
            return new Date(dateStr).toLocaleString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            });
        } catch {
            return dateStr;
        }
    };

    const isPending = session.status === 'Pending' || session.status === 1;
    const isClosed = session.status === 'Closed' || session.status === 3;
    const canPerformStaffActions = isCurrentStaffOwner && !isPending && !isClosed;

    return (
        <aside className={styles.customerDetailsPanel}>
            {/* THÔNG TIN KHÁCH HÀNG */}
            <div className={styles.detailCard}>
                <div className={styles.cardHeading}>
                    <span>Hồ sơ khách hàng</span>
                    <User size={15} />
                </div>
                <div className={styles.profileBrief}>
                    <div className={styles.briefAvatar}>
                        {getInitials(session.customerName)}
                    </div>
                    <div className={styles.briefName}>{session.customerName}</div>
                    <div className={styles.briefHandle}>ID Khách: #{session.customerId}</div>
                </div>

                <div className={styles.metaList}>
                    <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Email liên hệ</span>
                        <span className={styles.metaVal}>
                            <Mail size={12} style={{ display: 'inline', marginRight: 4 }} />
                            {session.customerEmail || 'Chưa cung cấp'}
                        </span>
                    </div>

                    <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Số điện thoại</span>
                        <span className={styles.metaVal}>
                            <Phone size={12} style={{ display: 'inline', marginRight: 4 }} />
                            {session.customerPhone || 'Chưa cung cấp'}
                        </span>
                    </div>

                    <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Thời gian bắt đầu</span>
                        <span className={styles.metaVal}>
                            <Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />
                            {formatDateTime(session.startedAt)}
                        </span>
                    </div>

                    <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Nhân viên phụ trách</span>
                        <span className={styles.metaVal}>
                            <ShieldCheck size={12} style={{ display: 'inline', marginRight: 4, color: '#0B409C' }} />
                            {session.staffName || 'Chưa phân bổ (Hàng đợi)'}
                        </span>
                    </div>
                </div>
            </div>

            {/* GHI CHÚ NỘI BỘ */}
            <div className={styles.detailCard}>
                <div className={styles.cardHeading}>
                    <span>Ghi chú nội bộ</span>
                    {savedSuccess && <span style={{ color: '#15803d', fontSize: '11px' }}>Đã lưu!</span>}
                </div>
                <textarea
                    className={styles.noteTextarea}
                    placeholder="Nhập lưu ý về sở thích sách, mã đơn hàng cần kiểm tra, hoặc tình trạng khiếu nại của khách..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={1000}
                />
                <button
                    type="button"
                    className={styles.btnSaveNote}
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? 'Đang lưu...' : 'Lưu ghi chú'}
                </button>
            </div>

            {/* THAO TÁC NHANH */}
            {canPerformStaffActions && (
                <div className={styles.detailCard}>
                    <div className={styles.cardHeading}>
                        <span>Thao tác phiên</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button
                            type="button"
                            className={styles.btnActionOutline}
                            style={{ justifyContent: 'center' }}
                            onClick={onOpenTransferModal}
                        >
                            <Share2 size={14} /> Chuyển ca trực
                        </button>
                        <button
                            type="button"
                            className={styles.btnActionOutline}
                            style={{ justifyContent: 'center' }}
                            onClick={onOpenLeaveModal}
                        >
                            <LogOut size={14} /> Rời phiên (Về hàng chờ)
                        </button>
                        <button
                            type="button"
                            className={styles.btnEndSession}
                            style={{ justifyContent: 'center' }}
                            onClick={onOpenCloseModal}
                        >
                            <CheckCircle size={14} /> Kết thúc phiên
                        </button>
                    </div>
                </div>
            )}
        </aside>
    );
};

import React, { useState, useEffect } from 'react';
import { X, Share2 } from 'lucide-react';
import { chatHubService } from '../../../services/chatHubService';
import { adminUserService } from '../../../services/adminUserService';
import type { UserManagementItemDto } from '../../../types/adminUser';
import styles from './StaffChatConsole.module.css';

interface TransferSessionModalProps {
    isOpen: boolean;
    customerName: string;
    currentStaffId?: number;
    onClose: () => void;
    onConfirm: (targetStaffId: number, note?: string) => Promise<void>;
}

export const TransferSessionModal: React.FC<TransferSessionModalProps> = ({
    isOpen,
    customerName,
    currentStaffId,
    onClose,
    onConfirm,
}) => {
    const [staffList, setStaffList] = useState<UserManagementItemDto[]>([]);
    const [onlineStaffIds, setOnlineStaffIds] = useState<number[]>([]);
    const [targetStaffId, setTargetStaffId] = useState<number | ''>('');
    const [note, setNote] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        const loadStaffData = async () => {
            try {
                // Lấy danh sách tài khoản Staff từ adminUserService để chuyển ca
                const usersRes = await adminUserService.getUsers({ pageNumber: 1, pageSize: 50 });
                const items: UserManagementItemDto[] = usersRes.data?.items || [];
                const staffUsers = items.filter(
                    (u: UserManagementItemDto) => u.role === 'Staff' && u.id !== currentStaffId
                );
                setStaffList(staffUsers);

                // Lấy danh sách ID các nhân viên đang online từ Hub
                const onlineIds = await chatHubService.getOnlineStaffIds();
                setOnlineStaffIds(onlineIds);

                if (staffUsers.length > 0) {
                    setTargetStaffId(staffUsers[0].id);
                }
            } catch (err: any) {
                console.warn('Lỗi tải danh sách nhân viên:', err);
            }
        };

        loadStaffData();
        setNote('');
        setError(null);
    }, [isOpen, currentStaffId]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetStaffId) {
            setError('Vui lòng chọn nhân viên tiếp nhận.');
            return;
        }

        setIsSubmitting(true);
        setError(null);
        try {
            await onConfirm(Number(targetStaffId), note.trim() || undefined);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Chuyển giao phiên thất bại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.overlay} role="dialog" aria-modal="true">
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <h3>
                        <Share2 size={16} style={{ display: 'inline', marginRight: 6 }} />
                        Chuyển giao phiên hỗ trợ
                    </h3>
                    <button type="button" className={styles.modalClose} onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className={styles.modalBody}>
                        <div className={styles.confirmText}>
                            Chuyển phiên chat của khách hàng <b>{customerName}</b> cho đồng nghiệp trong ca trực:
                        </div>

                        {error && (
                            <div style={{ color: '#ef4444', fontSize: '12px', marginTop: 8, background: '#fee2e2', padding: '6px 10px', borderRadius: 4 }}>
                                {error}
                            </div>
                        )}

                        <div style={{ marginTop: 12 }}>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#5b6e99' }}>
                                Nhân viên tiếp nhận:
                            </label>
                            <select
                                className={styles.transferSelect}
                                value={targetStaffId}
                                onChange={(e) => setTargetStaffId(Number(e.target.value))}
                            >
                                {staffList.map((st) => {
                                    const isOnline = onlineStaffIds.includes(st.id);
                                    return (
                                        <option key={st.id} value={st.id}>
                                            {st.fullName} (@{st.username}) - {isOnline ? '🟢 Trực tuyến' : '⚪ Ngoại tuyến'}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        <div style={{ marginTop: 12 }}>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#5b6e99' }}>
                                Ghi chú bàn giao công việc:
                            </label>
                            <textarea
                                className={styles.transferNoteTextarea}
                                placeholder="Ghi chú tóm tắt yêu cầu để đồng nghiệp tiếp tục hỗ trợ liền mạch..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                maxLength={500}
                            />
                        </div>
                    </div>

                    <div className={styles.modalFooter}>
                        <button
                            type="button"
                            className={styles.btnSecondary}
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            className={styles.btnPrimary}
                            disabled={isSubmitting || !targetStaffId}
                        >
                            {isSubmitting ? 'Đang chuyển...' : 'Xác nhận chuyển'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

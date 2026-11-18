import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { UserRoleEnum, type UserManagementItemDto } from '../../../types/adminUser';
import styles from './AdminUser.module.css';

interface ChangeRoleModalProps {
    user: UserManagementItemDto | null;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (userId: number, newRole: UserRoleEnum) => Promise<{ success: boolean; message?: string }>;
}

const getRoleEnumFromString = (role: string): UserRoleEnum => {
    switch (role.toLowerCase()) {
        case 'admin':
            return UserRoleEnum.Admin;
        case 'shipper':
            return UserRoleEnum.Shipper;
        default:
            return UserRoleEnum.Staff;
    }
};

export const ChangeRoleModal: React.FC<ChangeRoleModalProps> = ({
    user,
    isOpen,
    onClose,
    onSubmit,
}) => {
    const [selectedRole, setSelectedRole] = useState<UserRoleEnum>(UserRoleEnum.Staff);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (user && isOpen) {
            setSelectedRole(getRoleEnumFromString(user.role));
            setIsSubmitting(false);
            setErrorMessage(null);
        }
    }, [user, isOpen]);

    if (!isOpen || !user) return null;

    const handleSave = async () => {
        setIsSubmitting(true);
        setErrorMessage(null);
        const result = await onSubmit(user.id, selectedRole);
        setIsSubmitting(false);
        if (result.success) {
            onClose();
        } else {
            setErrorMessage(result.message || 'Không thể cập nhật vai trò.');
        }
    };

    return (
        <div className={styles.overlay} onClick={() => !isSubmitting && onClose()}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <div>
                        <h3>Chỉnh sửa vai trò nội bộ — {user.fullName || user.username}</h3>
                        <p>@{user.username} · {user.email || 'Chưa cập nhật email'}</p>
                    </div>
                    <button
                        type="button"
                        className={styles.modalClose}
                        onClick={onClose}
                        disabled={isSubmitting}
                        aria-label="Đóng"
                    >
                        <X size={17} />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    <div className={styles.roleOptionsList}>
                        {/* Option Admin */}
                        <div className={styles.roleOption}>
                            <input
                                type="radio"
                                id="roleOptAdmin"
                                name="internalRole"
                                value={UserRoleEnum.Admin}
                                checked={selectedRole === UserRoleEnum.Admin}
                                onChange={() => {
                                    setSelectedRole(UserRoleEnum.Admin);
                                    setErrorMessage(null);
                                }}
                            />
                            <div>
                                <label htmlFor="roleOptAdmin">Quản trị viên (Admin)</label>
                                <span>Toàn quyền cấu hình, vận hành và phân quyền nhân sự.</span>
                            </div>
                        </div>

                        {/* Option Staff */}
                        <div className={styles.roleOption}>
                            <input
                                type="radio"
                                id="roleOptStaff"
                                name="internalRole"
                                value={UserRoleEnum.Staff}
                                checked={selectedRole === UserRoleEnum.Staff}
                                onChange={() => {
                                    setSelectedRole(UserRoleEnum.Staff);
                                    setErrorMessage(null);
                                }}
                            />
                            <div>
                                <label htmlFor="roleOptStaff">Nhân viên hệ thống (Staff)</label>
                                <span>Quản lý kho sách, tiếp nhận đơn và tư vấn Live Chat.</span>
                            </div>
                        </div>

                        {/* Option Shipper */}
                        <div className={styles.roleOption}>
                            <input
                                type="radio"
                                id="roleOptShipper"
                                name="internalRole"
                                value={UserRoleEnum.Shipper}
                                checked={selectedRole === UserRoleEnum.Shipper}
                                onChange={() => {
                                    setSelectedRole(UserRoleEnum.Shipper);
                                    setErrorMessage(null);
                                }}
                            />
                            <div>
                                <label htmlFor="roleOptShipper">Nhân viên giao hàng (Shipper)</label>
                                <span>Nhận vận đơn giao hàng và đối soát tiền thu hộ COD.</span>
                            </div>
                        </div>
                    </div>

                    {/* Hiển thị lỗi từ backend (Ví dụ E3: duy trì tối thiểu 01 Quản trị viên hoạt động) */}
                    {errorMessage && (
                        <div className={styles.formWarn} style={{ fontWeight: 600 }}>
                            {errorMessage}
                        </div>
                    )}

                    {/* Cảnh báo khi chuyển quyền thành Admin */}
                    {selectedRole === UserRoleEnum.Admin && !errorMessage && (
                        <div className={styles.formWarn}>
                            <strong>Cảnh báo bảo mật:</strong> Cấp quyền Admin cho phép người này can thiệp toàn bộ dữ liệu hệ thống, tạo hoặc phân quyền cho tài khoản khác.
                        </div>
                    )}

                    <p className={styles.formNote}>
                        <strong>Lưu ý:</strong> Thành viên (Member) là khách hàng mua sắm ngoài Storefront, không nằm trong danh mục phân quyền nhân sự nội bộ.
                    </p>
                </div>

                <div className={styles.modalFooter}>
                    <button
                        type="button"
                        className={styles.btnSecondary}
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        className={styles.btnPrimary}
                        onClick={handleSave}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChangeRoleModal;

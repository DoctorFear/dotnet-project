import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useUser } from '../../../context/UserContext';
import { useToastNotifications } from '../../../hooks/useToastNotifications';
import { ToastNotification } from '../../common/ToastNotification';
import { userService } from '../../../services/userService';
import { ProfileInput } from './ProfileInput';
import { AdminPasswordAccordion } from './AdminPasswordAccordion';
import styles from './AdminProfileModal.module.css';

interface AdminProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AdminProfileModal: React.FC<AdminProfileModalProps> = ({
    isOpen,
    onClose
}) => {
    const { user, updateUser } = useUser();
    const { toasts, notify, dismissToast } = useToastNotifications();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPasswordAccordionOpen, setIsPasswordAccordionOpen] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        fullName: '',
        phoneNumber: '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;
        const loadProfile = async () => {
            try {
                const res = await userService.getProfile();
                if (isMounted && res.success && res.data) {
                    setFormData({
                        username: res.data.username || user?.username || '',
                        email: res.data.email || user?.email || '',
                        fullName: res.data.fullName || user?.fullName || '',
                        phoneNumber: res.data.phoneNumber || '',
                        currentPassword: '',
                        newPassword: '',
                        confirmNewPassword: ''
                    });
                }
            } catch {
                if (isMounted && user) {
                    setFormData({
                        username: user.username,
                        email: user.email,
                        fullName: user.fullName,
                        phoneNumber: '',
                        currentPassword: '',
                        newPassword: '',
                        confirmNewPassword: ''
                    });
                }
            }
        };

        loadProfile();
        setIsPasswordAccordionOpen(false);
        setErrors({});

        return () => {
            isMounted = false;
        };
    }, [isOpen, user]);

    if (!isOpen) return null;

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => {
                const copy = { ...prev };
                delete copy[name];
                return copy;
            });
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            onClose();
        }
    };

    const handleSubmitProfile = async (e: React.FormEvent) => {
        e.preventDefault();

        const cleanFullName = formData.fullName.trim();
        const cleanPhone = formData.phoneNumber.trim();
        const newErrors: Record<string, string> = {};

        // 1. Validate Họ và tên
        if (!cleanFullName) {
            newErrors.fullName = 'Vui lòng nhập họ và tên';
        }

        // 2. Validate Số điện thoại: 10 chữ số VN bắt đầu bằng 0
        const phoneRegex = /^0(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-6|8|9]|9[0-4|6-9])[0-9]{7}$/;
        if (!cleanPhone) {
            newErrors.phoneNumber = 'Số điện thoại không được để trống';
        } else if (!phoneRegex.test(cleanPhone)) {
            newErrors.phoneNumber = 'Số điện thoại phải gồm đúng 10 chữ số (bắt đầu bằng 03, 05, 07, 08, 09)';
        }

        // 3. Validate Đổi mật khẩu nếu accordion mở hoặc có nhập bất kỳ ô mật khẩu nào
        const isChangingPassword = isPasswordAccordionOpen && (formData.currentPassword || formData.newPassword || formData.confirmNewPassword);
        if (isChangingPassword) {
            if (!formData.currentPassword) {
                newErrors.currentPassword = 'Mật khẩu hiện tại không được để trống';
            }

            if (!formData.newPassword) {
                newErrors.newPassword = 'Mật khẩu mới không được để trống';
            } else if (formData.newPassword.length < 6) {
                newErrors.newPassword = 'Mật khẩu mới phải từ 6 ký tự trở lên';
            } else if (formData.newPassword === formData.currentPassword) {
                newErrors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại';
            }

            if (!formData.confirmNewPassword) {
                newErrors.confirmNewPassword = 'Xác nhận mật khẩu không được để trống';
            } else if (formData.newPassword !== formData.confirmNewPassword) {
                newErrors.confirmNewPassword = 'Mật khẩu xác nhận không trùng khớp';
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setIsSubmitting(true);

        try {
            // 1. Cập nhật hồ sơ thông tin cá nhân
            const profileRes = await userService.updateProfile({
                fullName: cleanFullName,
                email: formData.email,
                phoneNumber: cleanPhone
            });

            if (!profileRes.success) {
                notify(profileRes.message || 'Cập nhật thông tin thất bại.', 'error');
                setIsSubmitting(false);
                return;
            }

            // Đồng bộ trực tiếp vào Global UserContext & LocalStorage
            updateUser({ fullName: cleanFullName, email: formData.email });

            // 2. Cập nhật mật khẩu nếu có thay đổi
            if (isChangingPassword) {
                const passRes = await userService.changePassword({
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword,
                    confirmNewPassword: formData.confirmNewPassword
                });

                if (!passRes.success) {
                    notify(`Hồ sơ đã cập nhật nhưng đổi mật khẩu lỗi: ${passRes.message}`, 'error');
                    setIsSubmitting(false);
                    return;
                }
            }

            notify('Cập nhật thông tin tài khoản thành công!', 'success');
            setTimeout(() => {
                onClose();
            }, 500);
        } catch (err: any) {
            notify(err.message || 'Lỗi kết nối máy chủ.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={handleClose}>
            <ToastNotification toasts={toasts} onClose={dismissToast} />

            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <div>
                        <h3>Chỉnh sửa thông tin tài khoản</h3>
                        <p>Cập nhật hồ sơ và mật khẩu bảo mật</p>
                    </div>
                    <button
                        type="button"
                        className={styles.modalClose}
                        onClick={handleClose}
                        aria-label="Đóng"
                    >
                        <X size={17} />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    <form id="selfEditForm" onSubmit={handleSubmitProfile} noValidate>
                        {/* Tên đăng nhập (Đóng băng) */}
                        <ProfileInput
                            label="Tên đăng nhập (Đóng băng)"
                            value={formData.username}
                            readOnly
                        />

                        {/* Địa chỉ Email (Đóng băng) */}
                        <ProfileInput
                            label="Địa chỉ Email (Đóng băng)"
                            type="email"
                            value={formData.email}
                            readOnly
                        />

                        {/* Họ và tên * */}
                        <ProfileInput
                            id="selfFullName"
                            name="fullName"
                            label="Họ và tên"
                            value={formData.fullName}
                            onChange={handleFormChange}
                            placeholder="Nhập họ và tên"
                            required
                            error={errors.fullName}
                        />

                        {/* Số điện thoại * */}
                        <ProfileInput
                            id="selfPhone"
                            name="phoneNumber"
                            label="Số điện thoại"
                            value={formData.phoneNumber}
                            onChange={handleFormChange}
                            placeholder="09xx xxx xxx"
                            required
                            maxLength={10}
                            error={errors.phoneNumber}
                        />

                        {/* COMPONENT ACCORDION ĐỔI MẬT KHẨU TÁCH BIỆT (TÁI SỬ DỤNG PasswordField) */}
                        <AdminPasswordAccordion
                            isOpen={isPasswordAccordionOpen}
                            onToggle={() => setIsPasswordAccordionOpen(!isPasswordAccordionOpen)}
                            currentPassword={formData.currentPassword}
                            newPassword={formData.newPassword}
                            confirmNewPassword={formData.confirmNewPassword}
                            errors={{
                                currentPassword: errors.currentPassword,
                                newPassword: errors.newPassword,
                                confirmNewPassword: errors.confirmNewPassword
                            }}
                            onChange={handleFormChange}
                        />
                    </form>
                </div>

                <div className={styles.modalFooter}>
                    <button
                        type="button"
                        className={styles.btnSecondary}
                        onClick={handleClose}
                        disabled={isSubmitting}
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        form="selfEditForm"
                        className={styles.btnPrimary}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminProfileModal;

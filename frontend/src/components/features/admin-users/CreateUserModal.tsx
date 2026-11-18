import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { UserRoleEnum, type CreateInternalUserRequestDto } from '../../../types/adminUser';
import styles from './AdminUser.module.css';

interface CreateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (payload: CreateInternalUserRequestDto) => Promise<{ success: boolean; message?: string }>;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
}) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        fullName: '',
        phoneNumber: '',
        role: UserRoleEnum.Staff,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [serverError, setServerError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                username: '',
                email: '',
                fullName: '',
                phoneNumber: '',
                role: UserRoleEnum.Staff,
            });
            setErrors({});
            setServerError(null);
            setIsSubmitting(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'role' ? Number(value) : value,
        }));
        setServerError(null);
        if (errors[name]) {
            setErrors((prev) => {
                const copy = { ...prev };
                delete copy[name];
                return copy;
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const username = formData.username.trim();
        const email = formData.email.trim();
        const fullName = formData.fullName.trim();
        const phoneNumber = formData.phoneNumber.trim();
        const newErrors: Record<string, string> = {};

        // 1. Validate Username (E4: Không bỏ trống, không chứa khoảng trắng)
        if (!username) {
            newErrors.username = 'Tên đăng nhập không được để trống.';
        } else if (/\s/.test(username)) {
            newErrors.username = 'Tên đăng nhập không được chứa khoảng trắng.';
        }

        // 2. Validate Email (E4: Đúng regex, không bỏ trống)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            newErrors.email = 'Email không được để trống.';
        } else if (!emailRegex.test(email)) {
            newErrors.email = 'Email không đúng định dạng.';
        }

        // 3. Validate Họ và tên (E4: Không bỏ trống)
        if (!fullName) {
            newErrors.fullName = 'Họ và tên không được để trống.';
        }

        // 4. Validate Số điện thoại (E4: Đúng 10 chữ số di động)
        const phoneRegex = /^0(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-6|8|9]|9[0-4|6-9])[0-9]{7}$/;
        if (!phoneNumber) {
            newErrors.phoneNumber = 'Số điện thoại không được để trống.';
        } else if (!phoneRegex.test(phoneNumber)) {
            newErrors.phoneNumber = 'Số điện thoại phải đủ 10 chữ số di động hợp lệ.';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setServerError(null);
        setIsSubmitting(true);

        const result = await onSubmit({
            username,
            email,
            fullName,
            phoneNumber,
            role: formData.role,
        });

        setIsSubmitting(false);
        if (result.success) {
            onClose();
        } else {
            const msg = result.message || 'Có lỗi xảy ra khi tạo tài khoản.';
            // Map lỗi trùng lặp từ Backend (E4) vào đúng ô vi phạm
            if (msg.includes('Tên đăng nhập')) {
                setErrors({ username: msg });
            } else if (msg.includes('Email')) {
                setErrors({ email: msg });
            } else if (msg.includes('Số điện thoại')) {
                setErrors({ phoneNumber: msg });
            } else {
                setServerError(msg);
            }
        }
    };

    return (
        <div className={styles.overlay} onClick={() => !isSubmitting && onClose()}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <div>
                        <h3>Tạo tài khoản nhân sự mới</h3>
                        <p>Cấp tài khoản nhân sự quản trị hoặc vận hành trên hệ thống</p>
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
                    <form id="createAccountForm" noValidate onSubmit={handleSubmit}>
                        {serverError && (
                            <div className={styles.formWarn} style={{ marginBottom: 14 }}>
                                {serverError}
                            </div>
                        )}

                        {/* Tên đăng nhập */}
                        <div className={styles.formGroupModal}>
                            <label htmlFor="createUsername">
                                Tên đăng nhập <span className={styles.req}>*</span>
                            </label>
                            <input
                                type="text"
                                id="createUsername"
                                name="username"
                                className={`${styles.formControlModal} ${
                                    errors.username ? styles.isInvalid : ''
                                }`}
                                placeholder="VD: an.nv, bao.ql"
                                value={formData.username}
                                onChange={handleChange}
                                autoFocus
                            />
                            {errors.username && (
                                <span className={styles.modalFieldError}>
                                    {errors.username}
                                </span>
                            )}
                        </div>

                        {/* Email */}
                        <div className={styles.formGroupModal}>
                            <label htmlFor="createEmail">
                                Email <span className={styles.req}>*</span>
                            </label>
                            <input
                                type="email"
                                id="createEmail"
                                name="email"
                                className={`${styles.formControlModal} ${
                                    errors.email ? styles.isInvalid : ''
                                }`}
                                placeholder="VD: nhanvien@ancientbook.vn"
                                value={formData.email}
                                onChange={handleChange}
                            />
                            {errors.email && (
                                <span className={styles.modalFieldError}>
                                    {errors.email}
                                </span>
                            )}
                        </div>

                        {/* Họ và tên */}
                        <div className={styles.formGroupModal}>
                            <label htmlFor="createFullName">
                                Họ và tên <span className={styles.req}>*</span>
                            </label>
                            <input
                                type="text"
                                id="createFullName"
                                name="fullName"
                                className={`${styles.formControlModal} ${
                                    errors.fullName ? styles.isInvalid : ''
                                }`}
                                placeholder="VD: Nguyễn Văn An"
                                value={formData.fullName}
                                onChange={handleChange}
                            />
                            {errors.fullName && (
                                <span className={styles.modalFieldError}>
                                    {errors.fullName}
                                </span>
                            )}
                        </div>

                        {/* Số điện thoại */}
                        <div className={styles.formGroupModal}>
                            <label htmlFor="createPhone">
                                Số điện thoại <span className={styles.req}>*</span>
                            </label>
                            <input
                                type="tel"
                                id="createPhone"
                                name="phoneNumber"
                                className={`${styles.formControlModal} ${
                                    errors.phoneNumber ? styles.isInvalid : ''
                                }`}
                                placeholder="VD: 0912345678"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                            />
                            {errors.phoneNumber && (
                                <span className={styles.modalFieldError}>
                                    {errors.phoneNumber}
                                </span>
                            )}
                        </div>

                        {/* Vai trò nội bộ (BR02: Chỉ 3 vai trò nội bộ) */}
                        <div className={styles.formGroupModal}>
                            <label htmlFor="createRole">
                                Vai trò nội bộ <span className={styles.req}>*</span>
                            </label>
                            <select
                                id="createRole"
                                name="role"
                                className={styles.formControlModal}
                                value={formData.role}
                                onChange={handleChange}
                            >
                                <option value={UserRoleEnum.Staff}>Nhân viên hệ thống (Staff)</option>
                                <option value={UserRoleEnum.Shipper}>Nhân viên giao hàng (Shipper)</option>
                                <option value={UserRoleEnum.Admin}>Quản trị viên (Admin)</option>
                            </select>
                        </div>

                        {/* Cảnh báo mật khẩu mặc định */}
                        <p className={styles.formNote}>
                            <strong>Mật khẩu khởi tạo:</strong> Mặc định là <code>Password@123</code>. Nhân sự có thể chủ động đổi mật khẩu sau lần đăng nhập đầu tiên.
                        </p>
                    </form>
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
                        type="submit"
                        form="createAccountForm"
                        className={styles.btnPrimary}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Đang tạo...' : 'Tạo tài khoản'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateUserModal;

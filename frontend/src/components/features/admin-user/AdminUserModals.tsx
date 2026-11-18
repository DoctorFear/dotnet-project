import React from 'react';
import { Lock, Unlock, X } from 'lucide-react';
import { INTERNAL_ROLES, ROLE_META, type useAdminUserManagement } from '../../../hooks/useAdminManagement';
import type { InternalUserRole } from '../../../types/adminUser';
import styles from './AdminUserManagement.module.css';

type Controller = ReturnType<typeof useAdminUserManagement>;

export const AdminUserModals: React.FC<{ controller: Controller }> = ({ controller }) => {
    const {
        isSubmitting,
        // Create
        isCreateOpen,
        createForm,
        createErrors,
        closeCreateModal,
        updateCreateField,
        submitCreateUser,
        // Role
        roleTargetUser,
        selectedRole,
        roleWarn,
        setSelectedRole,
        closeRoleModal,
        submitRoleChange,
        // Status
        statusTargetUser,
        statusWarn,
        closeStatusModal,
        submitStatusToggle,
    } = controller;

    return (
        <>
            {/* 1. MODAL PHÂN VAI TRÒ NỘI BỘ (ADMIN, STAFF, SHIPPER) */}
            {roleTargetUser && (
                <div className={styles.overlay} onClick={closeRoleModal}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div>
                                <h3>Chỉnh sửa vai trò nội bộ — {roleTargetUser.fullName}</h3>
                                <p>@{roleTargetUser.username} · {roleTargetUser.email}</p>
                            </div>
                            <button type="button" className={styles.modalClose} onClick={closeRoleModal} aria-label="Đóng">
                                <X size={18} />
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            {INTERNAL_ROLES.map((roleKey) => {
                                const meta = ROLE_META[roleKey];
                                return (
                                    <div key={roleKey} className={styles.roleOption}>
                                        <input
                                            type="radio"
                                            id={`role_${roleKey}`}
                                            name="user_role_radio"
                                            value={roleKey}
                                            checked={selectedRole === roleKey}
                                            onChange={() => setSelectedRole(roleKey)}
                                        />
                                        <div>
                                            <label htmlFor={`role_${roleKey}`}>{meta.label}</label>
                                            <span>{meta.optionDesc}</span>
                                        </div>
                                    </div>
                                );
                            })}

                            {roleWarn && <div className={styles.formWarn}>{roleWarn}</div>}

                            <p className={styles.formNote}>
                                <strong>Lưu ý:</strong> Thành viên (Member) là khách hàng mua sắm ngoài Storefront,
                                không nằm trong danh mục phân quyền nhân sự nội bộ.
                            </p>
                        </div>

                        <div className={styles.modalFooter}>
                            <button type="button" className={styles.btnSecondary} onClick={closeRoleModal} disabled={isSubmitting}>
                                Hủy
                            </button>
                            <button type="button" className={styles.btnPrimary} onClick={submitRoleChange} disabled={isSubmitting}>
                                {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. MODAL TẠO TÀI KHOẢN NHÂN SỰ MỚI */}
            {isCreateOpen && (
                <div className={styles.overlay} onClick={closeCreateModal}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div>
                                <h3>Tạo tài khoản nhân sự mới</h3>
                                <p>Cấp tài khoản nhân sự quản trị hoặc vận hành trên hệ thống</p>
                            </div>
                            <button type="button" className={styles.modalClose} onClick={closeCreateModal} aria-label="Đóng">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={submitCreateUser} noValidate>
                            <div className={styles.modalBody}>
                                <div className={styles.formGroupModal}>
                                    <label htmlFor="newUsername">
                                        Tên đăng nhập <span className={styles.req}>*</span>
                                    </label>
                                    <input
                                        id="newUsername"
                                        type="text"
                                        className={`${styles.formControlModal} ${createErrors.username ? styles.isInvalid : ''}`}
                                        placeholder="vd: lehoang_staff"
                                        value={createForm.username}
                                        onChange={(e) => updateCreateField('username', e.target.value)}
                                    />
                                    {createErrors.username && <span className={styles.modalFieldError}>{createErrors.username}</span>}
                                </div>

                                <div className={styles.formGroupModal}>
                                    <label htmlFor="newEmail">
                                        Địa chỉ Email <span className={styles.req}>*</span>
                                    </label>
                                    <input
                                        id="newEmail"
                                        type="email"
                                        className={`${styles.formControlModal} ${createErrors.email ? styles.isInvalid : ''}`}
                                        placeholder="vd: lehoang@ancientbook.vn"
                                        value={createForm.email}
                                        onChange={(e) => updateCreateField('email', e.target.value)}
                                    />
                                    {createErrors.email && <span className={styles.modalFieldError}>{createErrors.email}</span>}
                                </div>

                                <div className={styles.formGroupModal}>
                                    <label htmlFor="newFullName">
                                        Họ và tên <span className={styles.req}>*</span>
                                    </label>
                                    <input
                                        id="newFullName"
                                        type="text"
                                        className={`${styles.formControlModal} ${createErrors.fullName ? styles.isInvalid : ''}`}
                                        placeholder="vd: Lê Hoàng Khoa"
                                        value={createForm.fullName}
                                        onChange={(e) => updateCreateField('fullName', e.target.value)}
                                    />
                                    {createErrors.fullName && <span className={styles.modalFieldError}>{createErrors.fullName}</span>}
                                </div>

                                <div className={styles.formGroupModal}>
                                    <label htmlFor="newPhone">
                                        Số điện thoại <span className={styles.req}>*</span>
                                    </label>
                                    <input
                                        id="newPhone"
                                        type="text"
                                        maxLength={10}
                                        className={`${styles.formControlModal} ${createErrors.phoneNumber ? styles.isInvalid : ''}`}
                                        placeholder="vd: 0909123456"
                                        value={createForm.phoneNumber}
                                        onChange={(e) => updateCreateField('phoneNumber', e.target.value)}
                                    />
                                    {createErrors.phoneNumber && <span className={styles.modalFieldError}>{createErrors.phoneNumber}</span>}
                                </div>

                                <div className={styles.formGroupModal}>
                                    <label htmlFor="newRole">
                                        Vai trò nội bộ (1 Role duy nhất) <span className={styles.req}>*</span>
                                    </label>
                                    <select
                                        id="newRole"
                                        className={`${styles.formControlModal} ${createErrors.role ? styles.isInvalid : ''}`}
                                        value={createForm.role}
                                        onChange={(e) => updateCreateField('role', e.target.value as InternalUserRole)}
                                    >
                                        <option value="Admin">Quản trị viên (Admin)</option>
                                        <option value="Staff">Nhân viên hệ thống (Staff)</option>
                                        <option value="Shipper">Nhân viên giao hàng (Shipper)</option>
                                    </select>
                                    {createErrors.role && <span className={styles.modalFieldError}>{createErrors.role}</span>}
                                </div>

                                <div className={styles.formNote}>
                                    Tài khoản mới sẽ được kích hoạt mặc định. Mật khẩu khởi tạo mặc định là <strong>Password@123</strong>.
                                </div>
                            </div>

                            <div className={styles.modalFooter}>
                                <button type="button" className={styles.btnSecondary} onClick={closeCreateModal} disabled={isSubmitting}>
                                    Hủy
                                </button>
                                <button type="submit" className={styles.btnPrimary} disabled={isSubmitting}>
                                    {isSubmitting ? 'Đang tạo...' : 'Tạo tài khoản'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 3. MODAL KHÓA / MỞ KHÓA TÀI KHOẢN */}
            {statusTargetUser && (
                <div className={styles.overlay} onClick={closeStatusModal}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalBody} style={{ paddingTop: '24px' }}>
                            <div
                                className={`${styles.confirmIconWrap} ${
                                    statusTargetUser.isActive ? styles.dangerIcon : styles.successIcon
                                }`}
                            >
                                {statusTargetUser.isActive ? <Lock size={22} /> : <Unlock size={22} />}
                            </div>

                            <p className={styles.confirmText}>
                                {statusTargetUser.isActive ? (
                                    <>
                                        Bạn có chắc chắn muốn khóa tài khoản <b>{statusTargetUser.fullName}</b> (@
                                        {statusTargetUser.username})? Phiên đăng nhập sẽ bị thu hồi ngay lập tức.
                                    </>
                                ) : (
                                    <>
                                        Mở khóa tài khoản <b>{statusTargetUser.fullName}</b> (@{statusTargetUser.username})?
                                        Người dùng có thể đăng nhập trở lại bình thường.
                                    </>
                                )}
                            </p>

                            {statusWarn && <div className={styles.formWarn}>{statusWarn}</div>}
                        </div>

                        <div className={styles.modalFooter}>
                            <button type="button" className={styles.btnSecondary} onClick={closeStatusModal} disabled={isSubmitting}>
                                Hủy
                            </button>
                            <button
                                type="button"
                                className={`${styles.btnPrimary} ${statusTargetUser.isActive ? styles.btnDanger : ''}`}
                                onClick={submitStatusToggle}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Đang xử lý...' : 'Xác nhận'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminUserModals;
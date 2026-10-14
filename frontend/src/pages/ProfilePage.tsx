import React, { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { useUser } from '../context/UserContext';
import { useToastNotifications } from '../hooks/useToastNotifications';
import { ToastNotification } from '../components/common/ToastNotification';
import type { UserProfileResponseDto, AddressDto } from '../types/user';
import styles from './ProfilePage.module.css';

export const ProfilePage: React.FC = () => {
    const { updateUser } = useUser();
    const { toasts, notify, dismissToast } = useToastNotifications();

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
    const [isSavingPassword, setIsSavingPassword] = useState<boolean>(false);

    // Thông tin tài khoản (đã có hasPassword để khớp chính xác UserProfileResponseDto)
    const [profile, setProfile] = useState<UserProfileResponseDto>({
        id: 0,
        username: '',
        email: '',
        fullName: '',
        phoneNumber: '',
        role: '',
        hasPassword: true,
        addresses: []
    });

    // Form Đổi mật khẩu
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        setIsLoading(true);
        try {
            const res = await userService.getProfile();
            if (res.success && res.data) {
                const data = res.data;
                setProfile({
                    ...data,
                    phoneNumber: data.phoneNumber || '',
                    addresses: data.addresses || []
                });
            } else {
                notify(res.message || 'Không thể tải thông tin hồ sơ cá nhân.', 'error');
            }
        } catch (err: any) {
            notify(err.message || 'Lỗi kết nối máy chủ.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // --- Quản lý Địa chỉ nhận hàng (BR04: tối đa 2 địa chỉ) ---
    const handleAddAddress = () => {
        if (profile.addresses.length >= 2) {
            notify('Thành viên chỉ được lưu tối đa 2 địa chỉ nhận hàng.', 'error');
            return;
        }

        const newAddress: AddressDto = {
            province: '',
            ward: '',
            streetAddress: '',
            isDefault: profile.addresses.length === 0
        };

        setProfile((prev) => ({
            ...prev,
            addresses: [...prev.addresses, newAddress]
        }));
    };

    const handleRemoveAddress = (index: number) => {
        const updated = profile.addresses.filter((_, idx) => idx !== index);
        if (updated.length > 0 && !updated.some((a) => a.isDefault)) {
            updated[0].isDefault = true;
        }
        setProfile((prev) => ({ ...prev, addresses: updated }));
    };

    const handleAddressChange = (index: number, field: keyof AddressDto, value: any) => {
        const updated = [...profile.addresses];
        updated[index] = { ...updated[index], [field]: value };
        setProfile((prev) => ({ ...prev, addresses: updated }));
    };

    const handleSetDefaultAddress = (index: number) => {
        const updated = profile.addresses.map((item, idx) => ({
            ...item,
            isDefault: idx === index
        }));
        setProfile((prev) => ({ ...prev, addresses: updated }));
    };

    // --- Cập nhật Profile ---
    const onSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();

        const fullName = profile.fullName.trim();
        const email = profile.email.trim();
        const phoneNumber = profile.phoneNumber.trim();

        if (!fullName) {
            notify('Họ và tên không được để trống.', 'error');
            return;
        }

        if (!email) {
            notify('Email không được để trống.', 'error');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            notify('Email không đúng định dạng.', 'error');
            return;
        }

        if (phoneNumber) {
            const phoneRegex = /^0\d{9}$/;
            if (!phoneRegex.test(phoneNumber)) {
                notify('Số điện thoại phải có định dạng 10 chữ số (bắt đầu bằng 0).', 'error');
                return;
            }
        }

        for (let i = 0; i < profile.addresses.length; i++) {
            const addr = profile.addresses[i];
            if (!addr.province.trim() || !addr.ward.trim() || !addr.streetAddress.trim()) {
                notify(`Vui lòng điền đủ Tỉnh/Thành, Phường/Xã và Số nhà cho địa chỉ thứ ${i + 1}.`, 'error');
                return;
            }
        }

        setIsSavingProfile(true);
        try {
            const res = await userService.updateProfile({
                fullName,
                email,
                phoneNumber,
                addresses: profile.addresses
            });

            // Thu hẹp kiểu dữ liệu (Type Narrowing) chống lỗi TS18049
            if (res.success && res.data) {
                const updatedData = res.data;
                notify('Cập nhật hồ sơ thành công!', 'success');
                setProfile((prev) => ({
                    ...prev,
                    ...updatedData,
                    addresses: updatedData.addresses || []
                }));
                // Cập nhật lại context đồng bộ cho Header
                updateUser({ fullName: updatedData.fullName, email: updatedData.email });
            } else {
                notify(res.message || 'Cập nhật hồ sơ thất bại.', 'error');
            }
        } catch (err: any) {
            notify(err.message || 'Lỗi kết nối máy chủ.', 'error');
        } finally {
            setIsSavingProfile(false);
        }
    };

    // --- Đổi mật khẩu ---
    const onChangePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!passwordForm.currentPassword) {
            notify('Vui lòng nhập mật khẩu hiện tại.', 'error');
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            notify('Mật khẩu mới phải có tối thiểu 6 ký tự.', 'error');
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
            notify('Mật khẩu xác nhận không trùng khớp.', 'error');
            return;
        }

        setIsSavingPassword(true);
        try {
            const res = await userService.changePassword(passwordForm);
            if (res.success) {
                notify('Đổi mật khẩu thành công!', 'success');
                setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
            } else {
                notify(res.message || 'Đổi mật khẩu thất bại.', 'error');
            }
        } catch (err: any) {
            notify(err.message || 'Lỗi kết nối máy chủ.', 'error');
        } finally {
            setIsSavingPassword(false);
        }
    };

    if (isLoading) {
        return <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Đang tải thông tin cá nhân...</div>;
    }

    return (
        <div className={styles.profileContainer}>
            <ToastNotification toasts={toasts} onClose={dismissToast} />

            {/* Khối 1: Thông tin cá nhân & Địa chỉ */}
            <div className={styles.profileCard}>
                <div className={styles.headerSection}>
                    <h2 className={styles.headerTitle}>Hồ sơ cá nhân</h2>
                    <p className={styles.headerSubtitle}>
                        Quản lý họ tên, email, số điện thoại và danh sách địa chỉ nhận sách
                    </p>
                </div>

                <form onSubmit={onSaveProfile} noValidate>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label>Tên đăng nhập (Cố định)</label>
                            <input type="text" value={profile.username} readOnly />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Vai trò hệ thống</label>
                            <input type="text" value={profile.role} readOnly />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Họ và tên *</label>
                            <input
                                type="text"
                                value={profile.fullName}
                                onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
                                maxLength={100}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Email liên hệ *</label>
                            <input
                                type="email"
                                value={profile.email}
                                onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                            />
                        </div>

                        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                            <label>Số điện thoại</label>
                            <input
                                type="tel"
                                placeholder="10 số bắt đầu bằng 0 (ví dụ: 0912345678)"
                                value={profile.phoneNumber}
                                onChange={(e) => setProfile((p) => ({ ...p, phoneNumber: e.target.value }))}
                                maxLength={10}
                            />
                        </div>
                    </div>

                    {/* Danh sách địa chỉ nhận hàng */}
                    <div className={styles.addressSection}>
                        <div className={styles.addressHeader}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>
                                    Địa chỉ nhận hàng (Tối đa 2)
                                </h3>
                                <small style={{ color: '#64748b' }}>Phục vụ giao nhận sách tận nơi</small>
                            </div>
                            {profile.addresses.length < 2 && (
                                <button type="button" className={styles.btnSecondary} onClick={handleAddAddress}>
                                    + Thêm địa chỉ
                                </button>
                            )}
                        </div>

                        {profile.addresses.length === 0 ? (
                            <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '14px' }}>
                                Chưa có địa chỉ giao hàng nào được lưu.
                            </p>
                        ) : (
                            profile.addresses.map((addr, idx) => (
                                <div
                                    key={idx}
                                    className={`${styles.addressCardItem} ${addr.isDefault ? styles.defaultAddress : ''}`}
                                >
                                    <div className={styles.addressRow}>
                                        <input
                                            type="text"
                                            placeholder="Tỉnh / Thành phố"
                                            value={addr.province}
                                            onChange={(e) => handleAddressChange(idx, 'province', e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Phường / Xã"
                                            value={addr.ward}
                                            onChange={(e) => handleAddressChange(idx, 'ward', e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Số nhà, tên đường"
                                            value={addr.streetAddress}
                                            onChange={(e) => handleAddressChange(idx, 'streetAddress', e.target.value)}
                                        />
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            {addr.isDefault ? (
                                                <span className={styles.badgeDefault}>[Mặc định]</span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className={styles.btnSecondary}
                                                    onClick={() => handleSetDefaultAddress(idx)}
                                                >
                                                    Đặt mặc định
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                className={styles.btnDanger}
                                                onClick={() => handleRemoveAddress(idx)}
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className={styles.btnGroup}>
                        <button type="submit" className={styles.btnPrimary} disabled={isSavingProfile}>
                            {isSavingProfile ? 'Đang lưu...' : 'Lưu thay đổi hồ sơ'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Khối 2: Đổi mật khẩu */}
            <div className={styles.profileCard}>
                <div className={styles.headerSection}>
                    <h2 className={styles.headerTitle}>Bảo mật & Mật khẩu</h2>
                    <p className={styles.headerSubtitle}>
                        Thay đổi mật khẩu đăng nhập định kỳ để bảo vệ tài khoản
                    </p>
                </div>

                <form onSubmit={onChangePasswordSubmit} noValidate>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label>Mật khẩu hiện tại *</label>
                            <input
                                type="password"
                                placeholder="Nhập mật khẩu đang dùng"
                                value={passwordForm.currentPassword}
                                onChange={(e) =>
                                    setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))
                                }
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Mật khẩu mới *</label>
                            <input
                                type="password"
                                placeholder="Tối thiểu 6 ký tự"
                                value={passwordForm.newPassword}
                                onChange={(e) =>
                                    setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))
                                }
                            />
                        </div>

                        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                            <label>Xác nhận mật khẩu mới *</label>
                            <input
                                type="password"
                                placeholder="Nhập lại mật khẩu mới"
                                value={passwordForm.confirmNewPassword}
                                onChange={(e) =>
                                    setPasswordForm((p) => ({ ...p, confirmNewPassword: e.target.value }))
                                }
                            />
                        </div>
                    </div>

                    <div className={styles.btnGroup}>
                        <button type="submit" className={styles.btnPrimary} disabled={isSavingPassword}>
                            {isSavingPassword ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfilePage;
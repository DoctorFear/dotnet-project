import React, { useState, useEffect } from 'react';
import { User, Lock, MapPin, Plus, Eye, EyeOff } from 'lucide-react';
import { userService } from '../services/userService';
import { useUser } from '../context/UserContext';
import { useToastNotifications } from '../hooks/useToastNotifications';
import { ToastNotification } from '../components/common/ToastNotification';
import { TopBar } from '../components/layout/TopBar';
import { Header } from '../components/layout/Header';
import { Navbar } from '../components/layout/Navbar';
import { getHcmWardsFromApi, DEFAULT_PROVINCE_NAME } from '../utils/vietnamAddress';
import type { UserProfileResponseDto, AddressDto } from '../types/user';
import styles from './ProfilePage.module.css';

export const ProfilePage: React.FC = () => {
    const { updateUser } = useUser();
    const { toasts, notify, dismissToast } = useToastNotifications();

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
    const [isSavingPassword, setIsSavingPassword] = useState<boolean>(false);
    const [showPasswordSection, setShowPasswordSection] = useState<boolean>(false);

    // Visibility toggles cho mật khẩu
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Danh sách Phường/Xã tại TPHCM lấy trực tiếp từ API roooming
    const [hcmWards, setHcmWards] = useState<string[]>([]);

    // Thông tin tài khoản
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

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        initData();
    }, []);

    const initData = async () => {
        setIsLoading(true);
        try {
            // 1. Lấy danh sách Phường/Xã TPHCM từ API https://vietnam-address.roooming.io.vn/api/provinces/29/wards
            const wards = await getHcmWardsFromApi();
            setHcmWards(wards);

            // 2. Tải thông tin profile từ backend
            const res = await userService.getProfile();
            if (res.success && res.data) {
                const data = res.data;
                const addresses = data.addresses && data.addresses.length > 0 
                    ? data.addresses.map((a, idx) => ({
                        ...a,
                        province: DEFAULT_PROVINCE_NAME,
                        isDefault: idx === 0
                    }))
                    : [{ province: DEFAULT_PROVINCE_NAME, ward: '', streetAddress: '', isDefault: true }];

                setProfile({
                    ...data,
                    phoneNumber: data.phoneNumber || '',
                    addresses
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

    // --- Quản lý Địa chỉ nhận hàng (tối đa 2 địa chỉ) ---
    const handleAddSecondAddress = () => {
        if (profile.addresses.length >= 2) {
            notify('Thành viên chỉ được lưu tối đa 2 địa chỉ nhận hàng.', 'error');
            return;
        }

        const newAddress: AddressDto = {
            province: DEFAULT_PROVINCE_NAME,
            ward: '',
            streetAddress: '',
            isDefault: false
        };

        setProfile((prev) => ({
            ...prev,
            addresses: [...prev.addresses, newAddress]
        }));
    };

    const handleRemoveSecondAddress = () => {
        if (profile.addresses.length > 1) {
            const updated = [profile.addresses[0]];
            updated[0].isDefault = true;
            setProfile((prev) => ({ ...prev, addresses: updated }));
            setErrors(prev => {
                const copy = { ...prev };
                delete copy.ward2;
                delete copy.street2;
                return copy;
            });
        }
    };

    const handleAddressChange = (index: number, field: keyof AddressDto, value: string) => {
        const updated = [...profile.addresses];
        if (updated[index]) {
            updated[index] = { ...updated[index], [field]: value };
            setProfile((prev) => ({ ...prev, addresses: updated }));
        }
    };

    // --- Cập nhật Profile ---
    const onSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();

        const fullName = profile.fullName.trim();
        const phoneNumber = profile.phoneNumber.trim();
        const newErrors: Record<string, string> = {};

        // 1. Validate Họ và tên
        if (!fullName) {
            newErrors.fullName = 'Vui lòng nhập họ và tên';
        }

        // 2. Validate Số điện thoại (10 số, đầu 03, 05, 07, 08, 09)
        const phoneRegex = /^0(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-6|8|9]|9[0-4|6-9])[0-9]{7}$/;
        if (!phoneNumber) {
            newErrors.phoneNumber = 'Vui lòng nhập số điện thoại';
        } else if (!phoneRegex.test(phoneNumber)) {
            newErrors.phoneNumber = 'Số điện thoại phải gồm đúng 10 chữ số (bắt đầu bằng 03, 05, 07, 08, 09)';
        }

        // 3. Validate Địa chỉ 1
        const a1 = profile.addresses[0];
        if (a1) {
            if (!a1.ward) newErrors.ward1 = 'Vui lòng chọn Phường / Xã';
            if (!a1.streetAddress.trim()) newErrors.street1 = 'Vui lòng nhập số nhà, tên đường';
        }

        // 4. Validate Địa chỉ 2 nếu có
        const a2 = profile.addresses[1];
        if (a2) {
            if (!a2.ward) newErrors.ward2 = 'Vui lòng chọn Phường / Xã';
            if (!a2.streetAddress.trim()) newErrors.street2 = 'Vui lòng nhập số nhà, tên đường';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setIsSavingProfile(true);

        try {
            const res = await userService.updateProfile({
                fullName,
                email: profile.email,
                phoneNumber,
                addresses: profile.addresses.map(a => ({
                    ...a,
                    province: DEFAULT_PROVINCE_NAME
                }))
            });

            if (res.success && res.data) {
                const updatedData = res.data;
                notify('Đã lưu thay đổi thông tin cá nhân thành công!', 'success');
                setProfile((prev) => ({
                    ...prev,
                    ...updatedData,
                    addresses: updatedData.addresses && updatedData.addresses.length > 0 
                        ? updatedData.addresses 
                        : prev.addresses
                }));
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
        const newErrors: Record<string, string> = {};

        if (!passwordForm.currentPassword) {
            newErrors.currentPassword = 'Mật khẩu hiện tại không chính xác';
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        if (!passwordForm.newPassword) {
            newErrors.newPassword = 'Mật khẩu mới không được để trống';
        } else if (!passwordRegex.test(passwordForm.newPassword)) {
            newErrors.newPassword = 'Mật khẩu mới từ 8 ký tự trở lên, gồm chữ hoa, chữ thường, số và tối thiểu 1 ký tự đặc biệt';
        } else if (passwordForm.newPassword === passwordForm.currentPassword) {
            newErrors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại';
        }

        if (!passwordForm.confirmNewPassword || passwordForm.newPassword !== passwordForm.confirmNewPassword) {
            newErrors.confirmNewPassword = 'Mật khẩu xác nhận không trùng khớp';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setIsSavingPassword(true);

        try {
            const res = await userService.changePassword(passwordForm);
            if (res.success) {
                notify('Đổi mật khẩu thành công!', 'success');
                setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
                setShowPasswordSection(false);
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
        return (
            <div className={styles.profilePageWrapper}>
                <TopBar />
                <Header />
                <Navbar showCategories={false} showPublishers={false} />
                <div style={{ textAlign: 'center', padding: '80px', color: '#5b6e99', fontWeight: 600 }}>
                    Đang tải thông tin hồ sơ...
                </div>
            </div>
        );
    }

    const addr1 = profile.addresses[0] || { province: DEFAULT_PROVINCE_NAME, ward: '', streetAddress: '', isDefault: true };
    const addr2 = profile.addresses[1];

    return (
        <div className={styles.profilePageWrapper}>
            <ToastNotification toasts={toasts} onClose={dismissToast} />

            {/* Dùng chung TopBar, Header & Navbar hệ thống */}
            <TopBar />
            <Header />
            <Navbar showCategories={false} showPublishers={false} />

            <main className={styles.mainContainerSingle}>
                {/* PANEL 1: THÔNG TIN CÁ NHÂN & ĐỊA CHỈ GIAO HÀNG */}
                <section className={styles.formPanel} id="info-form-section">
                    <div className={styles.panelHeader}>
                        <h2 className={styles.panelTitle}>
                            <User size={20} color="var(--egyptian, #0B409C)" />
                            Thông Tin Cá Nhân
                        </h2>
                    </div>

                    <form onSubmit={onSaveProfile} noValidate>
                        <div className={styles.formGridLayout}>
                            {/* Tên đăng nhập */}
                            <div className={styles.formField}>
                                <label className={styles.fieldLabel} htmlFor="inputUsername">Tên đăng nhập</label>
                                <div className={styles.inputWrapper}>
                                    <input
                                        type="text"
                                        id="inputUsername"
                                        className={styles.formControl}
                                        value={profile.username}
                                        readOnly
                                    />
                                </div>
                            </div>

                            {/* Địa chỉ Email */}
                            <div className={styles.formField}>
                                <label className={styles.fieldLabel} htmlFor="inputEmail">Địa chỉ Email</label>
                                <div className={styles.inputWrapper}>
                                    <input
                                        type="email"
                                        id="inputEmail"
                                        className={styles.formControl}
                                        value={profile.email}
                                        readOnly
                                    />
                                </div>
                            </div>

                            {/* Họ và tên */}
                            <div className={styles.formField}>
                                <label className={styles.fieldLabel} htmlFor="inputFullName">Họ và tên</label>
                                <div className={styles.inputWrapper}>
                                    <input
                                        type="text"
                                        id="inputFullName"
                                        className={`${styles.formControl} ${errors.fullName ? styles.errorState : ''}`}
                                        value={profile.fullName}
                                        onChange={(e) => {
                                            setProfile(p => ({ ...p, fullName: e.target.value }));
                                            if (errors.fullName) setErrors(prev => ({ ...prev, fullName: '' }));
                                        }}
                                        placeholder="Nhập họ và tên"
                                    />
                                </div>
                                {errors.fullName && <span className={styles.fieldErrorMsg}>{errors.fullName}</span>}
                            </div>

                            {/* Số điện thoại */}
                            <div className={styles.formField}>
                                <label className={styles.fieldLabel} htmlFor="inputPhone">Số điện thoại</label>
                                <div className={styles.inputWrapper}>
                                    <input
                                        type="text"
                                        id="inputPhone"
                                        className={`${styles.formControl} ${errors.phoneNumber ? styles.errorState : ''}`}
                                        value={profile.phoneNumber}
                                        onChange={(e) => {
                                            setProfile(p => ({ ...p, phoneNumber: e.target.value }));
                                            if (errors.phoneNumber) setErrors(prev => ({ ...prev, phoneNumber: '' }));
                                        }}
                                        placeholder="Nhập số điện thoại"
                                        maxLength={10}
                                    />
                                </div>
                                {errors.phoneNumber && <span className={styles.fieldErrorMsg}>{errors.phoneNumber}</span>}
                            </div>

                            {/* ĐỊA CHỈ 1 */}
                            <div className={styles.addressSectionDivider}>
                                <div className={styles.addressBox}>
                                    <div className={styles.addressBoxHeader}>
                                        <div className={styles.addressBoxTitle}>
                                            <MapPin size={16} color="var(--egyptian, #0B409C)" />
                                            <span>Địa chỉ nhận hàng 1</span>
                                        </div>
                                    </div>

                                    <div className={styles.formGridLayout} style={{ gap: '12px 16px' }}>
                                        {/* Tỉnh / Thành phố: Hiển thị dạng text input nền trắng giống số nhà, không dùng dropdown */}
                                        <div className={styles.formField}>
                                            <label className={styles.fieldLabel}>Tỉnh / Thành phố</label>
                                            <input
                                                type="text"
                                                id="province1"
                                                className={`${styles.formControl} ${styles.provinceStatic}`}
                                                value={DEFAULT_PROVINCE_NAME}
                                                readOnly
                                            />
                                        </div>

                                        {/* Dropdown Phường / Xã lấy từ API */}
                                        <div className={styles.formField}>
                                            <label className={styles.fieldLabel}>Phường / Xã</label>
                                            <select
                                                id="ward1"
                                                className={`${styles.formControl} ${styles.wardSelectControl} ${errors.ward1 ? styles.errorState : ''}`}
                                                style={{ backgroundColor: '#ffffff', color: '#071233' }}
                                                value={addr1.ward}
                                                onChange={(e) => {
                                                    handleAddressChange(0, 'ward', e.target.value);
                                                    if (errors.ward1) setErrors(prev => ({ ...prev, ward1: '' }));
                                                }}
                                            >
                                                <option value="">Chọn Phường / Xã</option>
                                                {hcmWards.map((wName, idx) => (
                                                    <option key={idx} value={wName}>
                                                        {wName}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.ward1 && <span className={styles.fieldErrorMsg}>{errors.ward1}</span>}
                                        </div>

                                        {/* Số nhà, tên đường */}
                                        <div className={`${styles.formField} ${styles.full}`}>
                                            <label className={styles.fieldLabel}>Số nhà, tên đường</label>
                                            <input
                                                type="text"
                                                id="street1"
                                                className={`${styles.formControl} ${errors.street1 ? styles.errorState : ''}`}
                                                placeholder="Nhập số nhà, tên đường..."
                                                value={addr1.streetAddress}
                                                onChange={(e) => {
                                                    handleAddressChange(0, 'streetAddress', e.target.value);
                                                    if (errors.street1) setErrors(prev => ({ ...prev, street1: '' }));
                                                }}
                                            />
                                            {errors.street1 && <span className={styles.fieldErrorMsg}>{errors.street1}</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ĐỊA CHỈ 2 (ẨN/HIỆN NHƯ MOCK) */}
                            {addr2 && (
                                <div id="secondAddressContainer" className={`${styles.formField} ${styles.full}`}>
                                    <div className={styles.addressBox}>
                                        <div className={styles.addressBoxHeader}>
                                            <div className={styles.addressBoxTitle}>
                                                <MapPin size={16} color="var(--catalina, #0D226B)" />
                                                <span>Địa chỉ nhận hàng 2</span>
                                            </div>
                                            <button
                                                type="button"
                                                className={styles.btnRemoveAddress}
                                                onClick={handleRemoveSecondAddress}
                                            >
                                                Xóa địa chỉ
                                            </button>
                                        </div>

                                        <div className={styles.formGridLayout} style={{ gap: '12px 16px' }}>
                                            {/* Tỉnh / Thành phố: Hiển thị dạng text input nền trắng giống số nhà, không dùng dropdown */}
                                            <div className={styles.formField}>
                                                <label className={styles.fieldLabel}>Tỉnh / Thành phố</label>
                                                <input
                                                    type="text"
                                                    id="province2"
                                                    className={`${styles.formControl} ${styles.provinceStatic}`}
                                                    value={DEFAULT_PROVINCE_NAME}
                                                    readOnly
                                                />
                                            </div>

                                            {/* Dropdown Phường / Xã lấy từ API */}
                                            <div className={styles.formField}>
                                                <label className={styles.fieldLabel}>Phường / Xã</label>
                                                <select
                                                    id="ward2"
                                                    className={`${styles.formControl} ${styles.wardSelectControl} ${errors.ward2 ? styles.errorState : ''}`}
                                                    style={{ backgroundColor: '#ffffff', color: '#071233' }}
                                                    value={addr2.ward}
                                                    onChange={(e) => {
                                                        handleAddressChange(1, 'ward', e.target.value);
                                                        if (errors.ward2) setErrors(prev => ({ ...prev, ward2: '' }));
                                                    }}
                                                >
                                                    <option value="">Chọn Phường / Xã</option>
                                                    {hcmWards.map((wName, idx) => (
                                                        <option key={idx} value={wName}>
                                                            {wName}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.ward2 && <span className={styles.fieldErrorMsg}>{errors.ward2}</span>}
                                            </div>

                                            {/* Số nhà, tên đường 2 */}
                                            <div className={`${styles.formField} ${styles.full}`}>
                                                <label className={styles.fieldLabel}>Số nhà, tên đường</label>
                                                <input
                                                    type="text"
                                                    id="street2"
                                                    className={`${styles.formControl} ${errors.street2 ? styles.errorState : ''}`}
                                                    placeholder="Nhập số nhà, tên đường..."
                                                    value={addr2.streetAddress}
                                                    onChange={(e) => {
                                                        handleAddressChange(1, 'streetAddress', e.target.value);
                                                        if (errors.street2) setErrors(prev => ({ ...prev, street2: '' }));
                                                    }}
                                                />
                                                {errors.street2 && <span className={styles.fieldErrorMsg}>{errors.street2}</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* NÚT THÊM ĐỊA CHỈ 2 */}
                            {!addr2 && (
                                <button
                                    type="button"
                                    id="btnAddSecondAddress"
                                    className={styles.btnAddSecondAddress}
                                    onClick={handleAddSecondAddress}
                                >
                                    <Plus size={16} />
                                    <span>Thêm địa chỉ nhận hàng thứ 2</span>
                                </button>
                            )}
                        </div>

                        <div className={styles.formActions}>
                            <button
                                type="submit"
                                className={styles.btnSubmitAction}
                                disabled={isSavingProfile}
                            >
                                {isSavingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>

                            <button
                                type="button"
                                id="btnTogglePasswordPanel"
                                className={styles.btnTriggerPwd}
                                onClick={() => setShowPasswordSection(!showPasswordSection)}
                            >
                                <Lock size={16} />
                                <span>{showPasswordSection ? 'Ẩn đổi mật khẩu' : 'Đổi mật khẩu'}</span>
                            </button>
                        </div>
                    </form>
                </section>

                {/* PANEL 2: ĐỔI MẬT KHẨU (TOGGLE) */}
                {showPasswordSection && (
                    <section className={styles.formPanel} id="pwd-form-section">
                        <div className={styles.panelHeader}>
                            <h2 className={styles.panelTitle}>
                                <Lock size={20} color="var(--catalina, #0D226B)" />
                                Đổi Mật Khẩu
                            </h2>
                            <button
                                type="button"
                                className={styles.btnRemoveAddress}
                                onClick={() => setShowPasswordSection(false)}
                            >
                                Đóng
                            </button>
                        </div>

                        <form onSubmit={onChangePasswordSubmit} noValidate>
                            <div className={styles.formGridLayout}>
                                {/* Mật khẩu hiện tại */}
                                <div className={`${styles.formField} ${styles.full}`}>
                                    <label className={styles.fieldLabel} htmlFor="inputCurrentPwd">Mật khẩu hiện tại</label>
                                    <div className={styles.inputWrapper}>
                                        <input
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            id="inputCurrentPwd"
                                            className={`${styles.formControl} ${errors.currentPassword ? styles.errorState : ''}`}
                                            placeholder="Nhập mật khẩu hiện tại"
                                            value={passwordForm.currentPassword}
                                            onChange={(e) => {
                                                setPasswordForm(p => ({ ...p, currentPassword: e.target.value }));
                                                if (errors.currentPassword) setErrors(prev => ({ ...prev, currentPassword: '' }));
                                            }}
                                        />
                                        <button
                                            type="button"
                                            className={styles.togglePwdBtn}
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            tabIndex={-1}
                                        >
                                            {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    {errors.currentPassword && <span className={styles.fieldErrorMsg}>{errors.currentPassword}</span>}
                                </div>

                                {/* Mật khẩu mới */}
                                <div className={styles.formField}>
                                    <label className={styles.fieldLabel} htmlFor="inputNewPwd">Mật khẩu mới</label>
                                    <div className={styles.inputWrapper}>
                                        <input
                                            type={showNewPassword ? 'text' : 'password'}
                                            id="inputNewPwd"
                                            className={`${styles.formControl} ${errors.newPassword ? styles.errorState : ''}`}
                                            placeholder="Tối thiểu 6 ký tự"
                                            value={passwordForm.newPassword}
                                            onChange={(e) => {
                                                setPasswordForm(p => ({ ...p, newPassword: e.target.value }));
                                                if (errors.newPassword) setErrors(prev => ({ ...prev, newPassword: '' }));
                                            }}
                                        />
                                        <button
                                            type="button"
                                            className={styles.togglePwdBtn}
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            tabIndex={-1}
                                        >
                                            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    {errors.newPassword && <span className={styles.fieldErrorMsg}>{errors.newPassword}</span>}
                                </div>

                                {/* Xác nhận mật khẩu mới */}
                                <div className={styles.formField}>
                                    <label className={styles.fieldLabel} htmlFor="inputConfirmPwd">Xác nhận mật khẩu mới</label>
                                    <div className={styles.inputWrapper}>
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            id="inputConfirmPwd"
                                            className={`${styles.formControl} ${errors.confirmNewPassword ? styles.errorState : ''}`}
                                            placeholder="Nhập lại mật khẩu mới"
                                            value={passwordForm.confirmNewPassword}
                                            onChange={(e) => {
                                                setPasswordForm(p => ({ ...p, confirmNewPassword: e.target.value }));
                                                if (errors.confirmNewPassword) setErrors(prev => ({ ...prev, confirmNewPassword: '' }));
                                            }}
                                        />
                                        <button
                                            type="button"
                                            className={styles.togglePwdBtn}
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            tabIndex={-1}
                                        >
                                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    {errors.confirmNewPassword && <span className={styles.fieldErrorMsg}>{errors.confirmNewPassword}</span>}
                                </div>
                            </div>

                            <div className={styles.formActions}>
                                <button
                                    type="submit"
                                    className={styles.btnSubmitAction}
                                    disabled={isSavingPassword}
                                >
                                    {isSavingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                                </button>
                            </div>
                        </form>
                    </section>
                )}
            </main>
        </div>
    );
};

export default ProfilePage;

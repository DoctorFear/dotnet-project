import React, { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { useUser } from '../context/UserContext';
import { useToastNotifications } from '../hooks/useToastNotifications';
import { ToastNotification } from '../components/common/ToastNotification';
import { TopBar } from '../components/layout/TopBar';
import { Header } from '../components/layout/Header';
import { Navbar } from '../components/layout/Navbar';
import { ProfileInfoForm } from '../components/features/profile/ProfileInfoForm';
import { ChangePasswordSection } from '../components/features/profile/ChangePasswordSection';
import { getHcmWardsFromApi, DEFAULT_PROVINCE_NAME } from '../utils/vietnamAddress';
import type { UserProfileResponseDto, AddressDto, ChangePasswordRequestDto } from '../types/user';
import styles from './ProfilePage.module.css';

export const ProfilePage: React.FC = () => {
    const { updateUser } = useUser();
    const { toasts, notify, dismissToast } = useToastNotifications();

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
    const [isSavingPassword, setIsSavingPassword] = useState<boolean>(false);
    const [showPasswordSection, setShowPasswordSection] = useState<boolean>(false);

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

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        let isMounted = true;

        const initData = async () => {
            try {
                const wards = await getHcmWardsFromApi();
                if (isMounted) setHcmWards(wards);
            } catch {
                // Đã có fallback trong utility
            }
            await fetchProfile();
        };

        initData();

        return () => {
            isMounted = false;
        };
    }, []);

    const fetchProfile = async () => {
        setIsLoading(true);
        try {
            const res = await userService.getProfile();
            if (res.success && res.data) {
                const data = res.data;
                const addresses: AddressDto[] = data.addresses && data.addresses.length > 0
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

    // --- Quản lý Địa chỉ nhận hàng ---
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
        if (profile.addresses.length <= 1) return;
        setProfile((prev) => ({
            ...prev,
            addresses: [{ ...prev.addresses[0], isDefault: true }]
        }));
        setErrors((prev) => {
            const copy = { ...prev };
            delete copy.ward2;
            delete copy.street2;
            return copy;
        });
    };

    const handleAddressChange = (index: number, field: keyof AddressDto, value: any) => {
        const updated = [...profile.addresses];
        if (updated[index]) {
            updated[index] = { ...updated[index], [field]: value };
            setProfile((prev) => ({ ...prev, addresses: updated }));
        }
        if (field === 'ward') {
            const errKey = index === 0 ? 'ward1' : 'ward2';
            if (errors[errKey]) setErrors(prev => ({ ...prev, [errKey]: '' }));
        }
        if (field === 'streetAddress') {
            const errKey = index === 0 ? 'street1' : 'street2';
            if (errors[errKey]) setErrors(prev => ({ ...prev, [errKey]: '' }));
        }
    };

    const handleProfileFieldChange = (field: keyof UserProfileResponseDto, value: any) => {
        setProfile(p => ({ ...p, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
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
    const onChangePasswordSubmit = async (passwordForm: ChangePasswordRequestDto): Promise<boolean> => {
        setIsSavingPassword(true);
        try {
            const res = await userService.changePassword(passwordForm);
            if (res.success) {
                notify('Đổi mật khẩu thành công!', 'success');
                setShowPasswordSection(false);
                return true;
            } else {
                notify(res.message || 'Đổi mật khẩu thất bại.', 'error');
                return false;
            }
        } catch (err: any) {
            notify(err.message || 'Lỗi kết nối máy chủ.', 'error');
            return false;
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

    return (
        <div className={styles.profilePageWrapper}>
            <ToastNotification toasts={toasts} onClose={dismissToast} />
            <TopBar />
            <Header />
            <Navbar showCategories={false} showPublishers={false} />

            <main className={styles.mainContainerSingle}>
                <ProfileInfoForm
                    profile={profile}
                    hcmWards={hcmWards}
                    errors={errors}
                    isSaving={isSavingProfile}
                    showPasswordSection={showPasswordSection}
                    onTogglePasswordSection={() => setShowPasswordSection(!showPasswordSection)}
                    onProfileChange={handleProfileFieldChange}
                    onAddressChange={handleAddressChange}
                    onAddSecondAddress={handleAddSecondAddress}
                    onRemoveSecondAddress={handleRemoveSecondAddress}
                    onSubmit={onSaveProfile}
                />

                {showPasswordSection && (
                    <ChangePasswordSection
                        onClose={() => setShowPasswordSection(false)}
                        onSubmit={onChangePasswordSubmit}
                        isSaving={isSavingPassword}
                    />
                )}
            </main>
        </div>
    );
};

export default ProfilePage;

import React from 'react';
import { User, Lock } from 'lucide-react';
import { AddressSection } from './AddressSection';
import type { UserProfileResponseDto, AddressDto } from '../../../types/user';
import styles from './ProfileInfoForm.module.css';

interface ProfileInfoFormProps {
    profile: UserProfileResponseDto;
    hcmWards: string[];
    errors: Record<string, string>;
    isSaving: boolean;
    showPasswordSection: boolean;
    onTogglePasswordSection: () => void;
    onProfileChange: (field: keyof UserProfileResponseDto, value: any) => void;
    onAddressChange: (index: number, field: keyof AddressDto, value: any) => void;
    onAddSecondAddress: () => void;
    onRemoveSecondAddress: () => void;
    onSubmit: (e: React.FormEvent) => void;
}

export const ProfileInfoForm: React.FC<ProfileInfoFormProps> = ({
    profile,
    hcmWards,
    errors,
    isSaving,
    showPasswordSection,
    onTogglePasswordSection,
    onProfileChange,
    onAddressChange,
    onAddSecondAddress,
    onRemoveSecondAddress,
    onSubmit
}) => {
    return (
        <section className={styles.formPanel} id="info-form-section">
            <div className={styles.panelHeader}>
                <h2 className={styles.panelTitle}>
                    <User size={20} color="var(--egyptian, #0B409C)" />
                    Thông Tin Cá Nhân
                </h2>
            </div>

            <form onSubmit={onSubmit} noValidate>
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
                                onChange={(e) => onProfileChange('fullName', e.target.value)}
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
                                onChange={(e) => onProfileChange('phoneNumber', e.target.value)}
                                placeholder="Nhập số điện thoại"
                                maxLength={10}
                            />
                        </div>
                        {errors.phoneNumber && <span className={styles.fieldErrorMsg}>{errors.phoneNumber}</span>}
                    </div>

                    {/* Khối quản lý địa chỉ */}
                    <AddressSection
                        addresses={profile.addresses}
                        hcmWards={hcmWards}
                        errors={{
                            ward1: errors.ward1,
                            street1: errors.street1,
                            ward2: errors.ward2,
                            street2: errors.street2
                        }}
                        onAddressChange={onAddressChange}
                        onAddSecondAddress={onAddSecondAddress}
                        onRemoveSecondAddress={onRemoveSecondAddress}
                    />
                </div>

                <div className={styles.formActions}>
                    <button
                        type="submit"
                        className={styles.btnSubmitAction}
                        disabled={isSaving}
                    >
                        {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>

                    <button
                        type="button"
                        id="btnTogglePasswordPanel"
                        className={styles.btnTriggerPwd}
                        onClick={onTogglePasswordSection}
                    >
                        <Lock size={16} />
                        <span>{showPasswordSection ? 'Ẩn đổi mật khẩu' : 'Đổi mật khẩu'}</span>
                    </button>
                </div>
            </form>
        </section>
    );
};

export default ProfileInfoForm;

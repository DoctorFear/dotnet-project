import React from 'react';
import { MapPin } from 'lucide-react';
import { DEFAULT_PROVINCE_NAME } from '../../../utils/vietnamAddress';
import type { AddressDto } from '../../../types/user';
import styles from './AddressItemCard.module.css';

interface AddressItemCardProps {
    index: number;
    address: AddressDto;
    hcmWards: string[];
    errors: { ward?: string; street?: string };
    onChange: (index: number, field: keyof AddressDto, value: any) => void;
    onRemove?: () => void;
    canRemove?: boolean;
}

export const AddressItemCard: React.FC<AddressItemCardProps> = ({
    index,
    address,
    hcmWards,
    errors,
    onChange,
    onRemove,
    canRemove = false
}) => {
    return (
        <div className={styles.addressBox}>
            <div className={styles.addressBoxHeader}>
                <div className={styles.addressBoxTitle}>
                    <MapPin size={16} color="var(--egyptian, #0B409C)" />
                    <span>Địa chỉ nhận hàng {index + 1}</span>
                </div>
                {canRemove && onRemove && (
                    <button
                        type="button"
                        className={styles.btnRemoveAddress}
                        onClick={onRemove}
                    >
                        Xóa địa chỉ
                    </button>
                )}
            </div>

            <div className={styles.formGridLayout} style={{ gap: '12px 16px' }}>
                {/* Tỉnh / Thành phố: Hiển thị dạng text input readonly nền var(--alice) */}
                <div className={styles.formField}>
                    <label className={styles.fieldLabel}>Tỉnh / Thành phố</label>
                    <input
                        type="text"
                        id={`province${index + 1}`}
                        className={`${styles.formControl} ${styles.provinceStatic}`}
                        value={DEFAULT_PROVINCE_NAME}
                        readOnly
                    />
                </div>

                {/* Dropdown Phường / Xã lấy từ API */}
                <div className={styles.formField}>
                    <label className={styles.fieldLabel}>Phường / Xã</label>
                    <select
                        id={`ward${index + 1}`}
                        className={`${styles.formControl} ${styles.wardSelectControl} ${errors.ward ? styles.errorState : ''}`}
                        style={{ backgroundColor: '#ffffff', color: '#071233' }}
                        value={address.ward}
                        onChange={(e) => onChange(index, 'ward', e.target.value)}
                    >
                        <option value="">Chọn Phường / Xã</option>
                        {hcmWards.map((wName, idx) => (
                            <option key={idx} value={wName}>
                                {wName}
                            </option>
                        ))}
                    </select>
                    {errors.ward && <span className={styles.fieldErrorMsg}>{errors.ward}</span>}
                </div>

                {/* Số nhà, tên đường */}
                <div className={`${styles.formField} ${styles.full}`}>
                    <label className={styles.fieldLabel}>Số nhà, tên đường</label>
                    <input
                        type="text"
                        id={`street${index + 1}`}
                        className={`${styles.formControl} ${errors.street ? styles.errorState : ''}`}
                        placeholder="Nhập số nhà, tên đường..."
                        value={address.streetAddress}
                        onChange={(e) => onChange(index, 'streetAddress', e.target.value)}
                    />
                    {errors.street && <span className={styles.fieldErrorMsg}>{errors.street}</span>}
                </div>
            </div>
        </div>
    );
};

export default AddressItemCard;

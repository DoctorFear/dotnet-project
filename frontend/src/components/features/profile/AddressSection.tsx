import React from 'react';
import { Plus } from 'lucide-react';
import { AddressItemCard } from './AddressItemCard';
import type { AddressDto } from '../../../types/user';
import styles from './AddressSection.module.css';

interface AddressSectionProps {
    addresses: AddressDto[];
    hcmWards: string[];
    errors: {
        ward1?: string;
        street1?: string;
        ward2?: string;
        street2?: string;
    };
    onAddressChange: (index: number, field: keyof AddressDto, value: any) => void;
    onAddSecondAddress: () => void;
    onRemoveSecondAddress: () => void;
}

export const AddressSection: React.FC<AddressSectionProps> = ({
    addresses,
    hcmWards,
    errors,
    onAddressChange,
    onAddSecondAddress,
    onRemoveSecondAddress
}) => {
    const addr1 = addresses[0] || { province: 'Thành phố Hồ Chí Minh', ward: '', streetAddress: '', isDefault: true };
    const addr2 = addresses[1];

    return (
        <div className={styles.addressSectionWrapper}>
            {/* Địa chỉ 1 */}
            <AddressItemCard
                index={0}
                address={addr1}
                hcmWards={hcmWards}
                errors={{ ward: errors.ward1, street: errors.street1 }}
                onChange={onAddressChange}
            />

            {/* Địa chỉ 2 nếu có */}
            {addr2 && (
                <AddressItemCard
                    index={1}
                    address={addr2}
                    hcmWards={hcmWards}
                    errors={{ ward: errors.ward2, street: errors.street2 }}
                    onChange={onAddressChange}
                    onRemove={onRemoveSecondAddress}
                    canRemove={true}
                />
            )}

            {/* Nút thêm địa chỉ 2 nếu chưa có */}
            {!addr2 && (
                <button
                    type="button"
                    className={styles.btnAddSecondAddress}
                    onClick={onAddSecondAddress}
                >
                    <Plus size={16} />
                    <span>Thêm địa chỉ nhận hàng thứ 2</span>
                </button>
            )}
        </div>
    );
};

export default AddressSection;

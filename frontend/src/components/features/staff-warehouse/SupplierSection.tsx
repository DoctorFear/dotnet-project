import React from 'react';
import { Search, RefreshCw, Plus, Edit3, Power, X } from 'lucide-react';
import type { SupplierDto } from '../../../types/warehouse';
import styles from '../../../pages/WarehouseLogisticsPage.module.css';

interface SupplierSectionProps {
    suppliers: SupplierDto[];
    supplierKeyword: string;
    setSupplierKeyword: (v: string) => void;
    supplierStatusFilter: string;
    setSupplierStatusFilter: (v: string) => void;
    filterSuppliers: () => Promise<void>;
    openCreateSupplierModal: () => void;
    openEditSupplierModal: (s: SupplierDto) => void;
    handleToggleSupplierStatus: (s: SupplierDto) => Promise<void>;
    isSupplierModalOpen: boolean;
    setIsSupplierModalOpen: (v: boolean) => void;
    editingSupplierId: number | null;
    supplierForm: {
        name: string;
        taxCode: string;
        contactPerson: string;
        phone: string;
        email: string;
        address: string;
        status: string;
    };
    setSupplierForm: React.Dispatch<
        React.SetStateAction<{
            name: string;
            taxCode: string;
            contactPerson: string;
            phone: string;
            email: string;
            address: string;
            status: string;
        }>
    >;
    handleSaveSupplier: (e: React.FormEvent) => Promise<void>;
}

export const SupplierToolbar: React.FC<
    Pick<
        SupplierSectionProps,
        | 'supplierKeyword'
        | 'setSupplierKeyword'
        | 'supplierStatusFilter'
        | 'setSupplierStatusFilter'
        | 'filterSuppliers'
        | 'openCreateSupplierModal'
    >
> = ({
    supplierKeyword,
    setSupplierKeyword,
    supplierStatusFilter,
    setSupplierStatusFilter,
    filterSuppliers,
    openCreateSupplierModal,
}) => (
    <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
            <div className={styles.searchWrap}>
                <Search size={16} />
                <input
                    className={styles.searchInput}
                    placeholder="Tìm tên NCC, mã số thuế, SĐT..."
                    value={supplierKeyword}
                    onChange={(e) => setSupplierKeyword(e.target.value)}
                />
            </div>
            <select
                className={styles.filterSelect}
                value={supplierStatusFilter}
                onChange={(e) => setSupplierStatusFilter(e.target.value)}
            >
                <option value="">Tất cả trạng thái hợp tác</option>
                <option value="Active">Đang hợp tác (Active)</option>
                <option value="Inactive">Ngừng hợp tác (Inactive)</option>
            </select>
            <button type="button" className={styles.btnSecondary} onClick={() => void filterSuppliers()}>
                <RefreshCw size={14} /> Lọc dữ liệu
            </button>
        </div>
        <div className={styles.toolbarRight}>
            <button type="button" className={styles.btnPrimary} onClick={openCreateSupplierModal}>
                <Plus size={16} /> Thêm Nhà cung cấp mới
            </button>
        </div>
    </div>
);

export const SupplierSection: React.FC<SupplierSectionProps> = ({
    suppliers,
    openEditSupplierModal,
    handleToggleSupplierStatus,
    isSupplierModalOpen,
    setIsSupplierModalOpen,
    editingSupplierId,
    supplierForm,
    setSupplierForm,
    handleSaveSupplier,
}) => {
    return (
        <>
            <table className={styles.dataTable}>
                <thead>
                    <tr>
                        <th>Mã NCC</th>
                        <th>Tên Nhà cung cấp & Người liên hệ</th>
                        <th>Mã số thuế</th>
                        <th>Điện thoại / Email</th>
                        <th>Địa chỉ trụ sở</th>
                        <th>Trạng thái hợp tác</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {suppliers.length === 0 ? (
                        <tr>
                            <td colSpan={7} className={styles.emptyState}>
                                Không tìm thấy Nhà cung cấp nào khớp bộ lọc.
                            </td>
                        </tr>
                    ) : (
                        suppliers.map((s) => (
                            <tr key={s.id}>
                                <td>
                                    <span className={styles.codeChip}>SUP-{s.id}</span>
                                </td>
                                <td>
                                    <div className={styles.cellTitle}>
                                        <strong>{s.name}</strong>
                                        <span>Đại diện: {s.contactPerson || 'Chưa cập nhật'}</span>
                                    </div>
                                </td>
                                <td>
                                    <span className={styles.codeChip}>{s.taxCode}</span>
                                </td>
                                <td>
                                    <div className={styles.cellTitle}>
                                        <strong>{s.phone}</strong>
                                        <span>{s.email}</span>
                                    </div>
                                </td>
                                <td>{s.address}</td>
                                <td>
                                    <span
                                        className={`${styles.statusBadge} ${
                                            s.status === 'Active' ? styles.badgeSuccess : styles.badgeDanger
                                        }`}
                                    >
                                        {s.status === 'Active' ? 'Đang hợp tác' : 'Ngừng hợp tác'}
                                    </span>
                                </td>
                                <td>
                                    <div className={styles.actionBtns}>
                                        <button
                                            type="button"
                                            className={styles.btnTable}
                                            onClick={() => openEditSupplierModal(s)}
                                        >
                                            <Edit3 size={13} /> Sửa
                                        </button>
                                        <button
                                            type="button"
                                            className={`${styles.btnTable} ${
                                                s.status === 'Active' ? styles.danger : styles.success
                                            }`}
                                            onClick={() => void handleToggleSupplierStatus(s)}
                                        >
                                            <Power size={13} />
                                            {s.status === 'Active' ? 'Ngừng hợp tác' : 'Hợp tác lại'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {isSupplierModalOpen && (
                <div className={styles.overlay}>
                    <form className={styles.modal} onSubmit={(e) => void handleSaveSupplier(e)}>
                        <div className={styles.modalHeader}>
                            <div>
                                <h3>
                                    {editingSupplierId
                                        ? `Cập nhật Nhà cung cấp #${editingSupplierId}`
                                        : 'Thêm Nhà cung cấp mới'}
                                </h3>
                                <p>Quản lý thông tin đối tác cung ứng sách, mã số thuế và trạng thái hợp tác</p>
                            </div>
                            <button
                                type="button"
                                className={styles.modalClose}
                                onClick={() => setIsSupplierModalOpen(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Tên Nhà cung cấp *</label>
                                    <input
                                        className={styles.formControl}
                                        required
                                        value={supplierForm.name}
                                        onChange={(e) =>
                                            setSupplierForm({ ...supplierForm, name: e.target.value })
                                        }
                                        placeholder="VD: Công ty CP Phát hành Sách FAHASA"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Mã số thuế *</label>
                                    <input
                                        className={styles.formControl}
                                        required
                                        value={supplierForm.taxCode}
                                        onChange={(e) =>
                                            setSupplierForm({ ...supplierForm, taxCode: e.target.value })
                                        }
                                        placeholder="VD: 0304132047"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Người đại diện liên hệ</label>
                                    <input
                                        className={styles.formControl}
                                        value={supplierForm.contactPerson}
                                        onChange={(e) =>
                                            setSupplierForm({
                                                ...supplierForm,
                                                contactPerson: e.target.value,
                                            })
                                        }
                                        placeholder="VD: Nguyễn Văn Hòa"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Số điện thoại</label>
                                    <input
                                        className={styles.formControl}
                                        value={supplierForm.phone}
                                        onChange={(e) =>
                                            setSupplierForm({ ...supplierForm, phone: e.target.value })
                                        }
                                        placeholder="VD: 02838225796"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Email liên hệ</label>
                                    <input
                                        type="email"
                                        className={styles.formControl}
                                        value={supplierForm.email}
                                        onChange={(e) =>
                                            setSupplierForm({ ...supplierForm, email: e.target.value })
                                        }
                                        placeholder="VD: contact@fahasa.com.vn"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Trạng thái hợp tác</label>
                                    <select
                                        className={styles.formControl}
                                        value={supplierForm.status}
                                        onChange={(e) =>
                                            setSupplierForm({ ...supplierForm, status: e.target.value })
                                        }
                                    >
                                        <option value="Active">Đang hợp tác (Active)</option>
                                        <option value="Inactive">Ngừng hợp tác (Inactive)</option>
                                    </select>
                                </div>
                                <div className={styles.formGroupFull}>
                                    <label className={styles.formLabel}>Địa chỉ trụ sở</label>
                                    <input
                                        className={styles.formControl}
                                        value={supplierForm.address}
                                        onChange={(e) =>
                                            setSupplierForm({ ...supplierForm, address: e.target.value })
                                        }
                                        placeholder="VD: 60-62 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button
                                type="button"
                                className={styles.btnSecondary}
                                onClick={() => setIsSupplierModalOpen(false)}
                            >
                                Hủy bỏ
                            </button>
                            <button type="submit" className={styles.btnPrimary}>
                                {editingSupplierId ? 'Lưu cập nhật' : 'Tạo Nhà cung cấp'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
};

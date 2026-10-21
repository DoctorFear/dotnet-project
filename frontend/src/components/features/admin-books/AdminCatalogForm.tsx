import { X } from 'lucide-react';
import type { useBookManagement } from '../../../hooks/useBookManagement';
import BookEditorFields from './BookEditorFields';
import styles from './AdminBookManagement.module.css';

export default function AdminCatalogForm({ controller }: { controller: ReturnType<typeof useBookManagement> }) {
    const { modalKind, editingId, formWarn, closeModal, saveModal } = controller;
    return <>
{/* MODAL THÊM / SỬA SÁCH, THỂ LOẠI & NXB */}
            {modalKind && (
                <div className={styles.overlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <div>
                                <h3>
                                    {editingId
                                        ? `Cập nhật ${modalKind === 'books' ? 'sách' : modalKind === 'categories' ? 'danh mục' : 'NXB'}`
                                        : `Thêm ${modalKind === 'books' ? 'sách mới' : modalKind === 'categories' ? 'danh mục mới' : 'NXB mới'}`}
                                </h3>
                            </div>
                            <button type="button" className={styles.modalClose} disabled={controller.isSaving || controller.uploadCount > 0} onClick={closeModal}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            {modalKind === 'books' && <BookEditorFields controller={controller} />}

                            {modalKind === 'categories' && <CategoryEditorFields controller={controller} />}

                            {modalKind === 'publishers' && <PublisherEditorFields controller={controller} />}

                            {formWarn && <div className={styles.formWarn}>{formWarn}</div>}
                        </div>

                        <div className={styles.modalFooter}>
                            <button type="button" className={styles.btnSecondary} disabled={controller.isSaving || controller.uploadCount > 0} onClick={closeModal}>
                                Hủy
                            </button>
                            <button type="button" className={styles.btnPrimary} disabled={controller.isSaving || controller.uploadCount > 0} onClick={saveModal}>
                                {controller.isSaving ? 'Đang lưu...' : 'Lưu'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
    </>;
}

function CategoryEditorFields({ controller }: { controller: ReturnType<typeof useBookManagement> }) {
    const { categories, draft, updateDraft } = controller;
    return (
<div className={styles.formGrid}>
                                    <div className={`${styles.formGroup} ${styles.full}`}>
                                        <label htmlFor="catName">Tên thể loại *</label>
                                        <input
                                            id="catName"
                                            type="text"
                                            className={styles.formControl}
                                            value={(draft.name as string) || ''}
                                            onChange={(e) => updateDraft('name', e.target.value)}
                                        />
                                    </div>
                                    <div className={`${styles.formGroup} ${styles.full}`}>
                                        <label htmlFor="parentId">Danh mục cha</label>
                                        <select
                                            id="parentId"
                                            className={styles.formControl}
                                            value={(draft.parentId as number) || ''}
                                            onChange={(e) => updateDraft('parentId', e.target.value)}
                                        >
                                            <option value="">Danh mục gốc (Không có cha)</option>
                                            {categories.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className={`${styles.formGroup} ${styles.full}`}>
                                        <label htmlFor="catDesc">Mô tả thể loại</label>
                                        <textarea
                                            id="catDesc"
                                            rows={3}
                                            className={styles.formControl}
                                            value={(draft.description as string) || ''}
                                            onChange={(e) => updateDraft('description', e.target.value)}
                                        />
                                    </div>
                                </div>
    );
}

function PublisherEditorFields({ controller }: { controller: ReturnType<typeof useBookManagement> }) {
    const { draft, updateDraft } = controller;
    return (
<div className={styles.formGrid}>
                                    <div className={`${styles.formGroup} ${styles.full}`}>
                                        <label htmlFor="pubName">Tên Nhà Xuất Bản *</label>
                                        <input
                                            id="pubName"
                                            type="text"
                                            className={styles.formControl}
                                            value={(draft.name as string) || ''}
                                            onChange={(e) => updateDraft('name', e.target.value)}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="pubPhone">Số điện thoại</label>
                                        <input
                                            id="pubPhone"
                                            type="text"
                                            className={styles.formControl}
                                            value={(draft.phone as string) || ''}
                                            onChange={(e) => updateDraft('phone', e.target.value)}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="pubEmail">Email liên hệ</label>
                                        <input
                                            id="pubEmail"
                                            type="email"
                                            className={styles.formControl}
                                            value={(draft.email as string) || ''}
                                            onChange={(e) => updateDraft('email', e.target.value)}
                                        />
                                    </div>
                                    <div className={`${styles.formGroup} ${styles.full}`}>
                                        <label htmlFor="pubAddress">Địa chỉ trụ sở</label>
                                        <input
                                            id="pubAddress"
                                            type="text"
                                            className={styles.formControl}
                                            value={(draft.address as string) || ''}
                                            onChange={(e) => updateDraft('address', e.target.value)}
                                        />
                                    </div>
                                </div>
    );
}

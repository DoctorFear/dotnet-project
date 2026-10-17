import { Lock, Ban, ChevronDown } from 'lucide-react';
import type { AdminBookStatus } from '../../../types/book';
import { BookImageUpload, BookEditionUpload } from './BookUploadFields';
import type { useBookManagement } from '../../../hooks/useBookManagement';
import styles from './AdminBookManagement.module.css';

export default function BookEditorFields({ controller }: { controller: ReturnType<typeof useBookManagement> }) {
    const { categories, publishers, editingId, draft, isCategoryDropdownOpen, categoryDropdownRef, selectedCategoriesText, isEBookDisabled, setIsCategoryDropdownOpen, updateDraft, toggleCategorySelection } = controller;
    return (
<div className={styles.formGrid}>
                                    <fieldset className={styles.publicationFormats}>
                                        <legend>Hình thức phát hành</legend>
                                        <div className={styles.publicationOptions}>
                                            {([['isPhysicalAvailable', 'Sách giấy'], ['isEBookAvailable', 'E-book'], ['isRentalAvailable', 'Thuê đọc']] as const).map(([field, label]) => (
                                                <label key={field} className={styles.publicationOption}>
                                                    <input
                                                        type="checkbox"
                                                        checked={draft[field] === true}
                                                        disabled={field === 'isRentalAvailable' && draft.isEBookAvailable !== true}
                                                        onChange={event => updateDraft(field, event.target.checked)}
                                                    />
                                                    <span>{label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </fieldset>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="title">Tên sách *</label>
                                        <input
                                            id="title"
                                            type="text"
                                            className={styles.formControl}
                                            value={(draft.title as string) || ''}
                                            onChange={(e) => updateDraft('title', e.target.value)}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="author">Tác giả *</label>
                                        <input
                                            id="author"
                                            type="text"
                                            className={styles.formControl}
                                            value={(draft.author as string) || ''}
                                            onChange={(e) => updateDraft('author', e.target.value)}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="isbn">Mã ISBN *</label>
                                        <input
                                            id="isbn"
                                            type="text"
                                            className={styles.formControl}
                                            disabled={!!editingId}
                                            value={(draft.isbn as string) || ''}
                                            onChange={(e) => updateDraft('isbn', e.target.value)}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="publisherId">Nhà xuất bản *</label>
                                        <select
                                            id="publisherId"
                                            className={styles.formControl}
                                            value={(draft.publisherId as number) || ''}
                                            onChange={(e) => updateDraft('publisherId', Number(e.target.value))}
                                        >
                                            {publishers.map((pub) => (
                                                <option key={pub.id} value={pub.id}>
                                                    {pub.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Chọn nhiều thể loại */}
                                    <div className={styles.formGroup} ref={categoryDropdownRef} style={{ position: 'relative' }}>
                                        <label>Thể loại (Chọn nhiều) *</label>
                                        <div
                                            className={styles.dropdownCheckboxTrigger}
                                            onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
                                        >
                                            <span className={styles.dropdownCheckboxValue}>{selectedCategoriesText}</span>
                                            <ChevronDown size={16} />
                                        </div>

                                        {isCategoryDropdownOpen && (
                                            <div className={styles.dropdownCheckboxMenu}>
                                                {categories.map((cat) => {
                                                    const currentCategoryIds = (draft.categoryIds as number[]) || [];
                                                    const isChecked = currentCategoryIds.includes(cat.id);
                                                    return (
                                                        <label
                                                            key={cat.id}
                                                            className={styles.checkboxOption}
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => toggleCategorySelection(cat.id)}
                                                            />
                                                            <span>{cat.name}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="status">Trạng thái kinh doanh</label>
                                        <select
                                            id="status"
                                            className={styles.formControl}
                                            value={(draft.status as AdminBookStatus) || 'selling'}
                                            onChange={(e) => updateDraft('status', e.target.value as AdminBookStatus)}
                                        >
                                            <option value="selling">Đang bán</option>
                                            <option value="upcoming">Sắp phát hành</option>
                                            <option value="stopped">Ngừng bán</option>
                                        </select>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="physicalPrice">Giá bán sách giấy (VNĐ)</label>
                                        <input
                                            id="physicalPrice"
                                            type="number"
                                            className={styles.formControl}
                                            value={(draft.physicalPrice as number) || 0}
                                            onChange={(e) => updateDraft('physicalPrice', Number(e.target.value))}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="eBookPrice">Giá bán E-book (VNĐ)</label>
                                        <input
                                            id="eBookPrice"
                                            type="number"
                                            className={styles.formControl}
                                            value={(draft.eBookPrice as number) || 0}
                                            onChange={(e) => updateDraft('eBookPrice', Number(e.target.value))}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="weeklyRentalPrice" className={isEBookDisabled ? styles.lockedLabel : ''}>
                                            Giá thuê theo Tuần (VNĐ) {isEBookDisabled && <Ban size={12} color="#94a3b8" />}
                                        </label>
                                        <input
                                            id="weeklyRentalPrice"
                                            type="number"
                                            disabled={isEBookDisabled}
                                            className={`${styles.formControl} ${isEBookDisabled ? styles.disabledInput : ''}`}
                                            value={isEBookDisabled ? 0 : (draft.weeklyRentalPrice as number) || 0}
                                            onChange={(e) => updateDraft('weeklyRentalPrice', Number(e.target.value))}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="monthlyRentalPrice" className={isEBookDisabled ? styles.lockedLabel : ''}>
                                            Giá thuê theo Tháng (VNĐ) {isEBookDisabled && <Ban size={12} color="#94a3b8" />}
                                        </label>
                                        <input
                                            id="monthlyRentalPrice"
                                            type="number"
                                            disabled={isEBookDisabled}
                                            className={`${styles.formControl} ${isEBookDisabled ? styles.disabledInput : ''}`}
                                            value={isEBookDisabled ? 0 : (draft.monthlyRentalPrice as number) || 0}
                                            onChange={(e) => updateDraft('monthlyRentalPrice', Number(e.target.value))}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="yearlyRentalPrice" className={isEBookDisabled ? styles.lockedLabel : ''}>
                                            Giá thuê theo Năm (VNĐ) {isEBookDisabled && <Ban size={12} color="#94a3b8" />}
                                        </label>
                                        <input
                                            id="yearlyRentalPrice"
                                            type="number"
                                            disabled={isEBookDisabled}
                                            className={`${styles.formControl} ${isEBookDisabled ? styles.disabledInput : ''}`}
                                            value={isEBookDisabled ? 0 : (draft.yearlyRentalPrice as number) || 0}
                                            onChange={(e) => updateDraft('yearlyRentalPrice', Number(e.target.value))}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="stockCount" className={styles.lockedLabel}>
                                            Số lượng tồn kho <Lock size={12} />
                                        </label>
                                        <input
                                            id="stockCount"
                                            type="number"
                                            className={`${styles.formControl} ${styles.disabledInput}`}
                                            disabled
                                            value={editingId ? (draft.stockCount as number) : 0}
                                        />
                                        <span className={styles.inputHelpText}>
                                            SL tồn kho chỉ được điều chỉnh khi lập Phiếu Nhập Kho.
                                        </span>
                                    </div>

                                    <div className={`${styles.formGroup} ${styles.full}`}>
                                        <label htmlFor="coverImg">Đường dẫn ảnh bìa chính (URL)</label>
                                        <BookImageUpload onBusyChange={controller.onUploadBusyChange} onUploaded={urls => updateDraft('coverImg', urls[0])} />
                                        <input
                                            id="coverImg"
                                            type="text"
                                            className={styles.formControl}
                                            value={(draft.coverImg as string) || ''}
                                            onChange={(e) => updateDraft('coverImg', e.target.value)}
                                        />
                                    </div>
                                    {(['pages', 'weight', 'publicationYear'] as const).map((field) => <div className={styles.formGroup} key={field}>
                                        <label htmlFor={field}>{field === 'pages' ? 'Số trang' : field === 'weight' ? 'Trọng lượng (g)' : 'Năm xuất bản'}</label>
                                        <input id={field} type="number" min="1" className={styles.formControl} value={String(draft[field] ?? '')} onChange={event => updateDraft(field, event.target.value)} />
                                    </div>)}
                                    {(['language', 'dimensions'] as const).map(field => <div className={styles.formGroup} key={field}><label htmlFor={field}>{field === 'language' ? 'Ngôn ngữ' : 'Kích thước'}</label><input id={field} className={styles.formControl} value={String(draft[field] ?? '')} onChange={event => updateDraft(field, event.target.value)} /></div>)}
                                    <div className={`${styles.formGroup} ${styles.full}`}><label htmlFor="bookDescription">Mô tả nội dung</label><textarea id="bookDescription" rows={5} className={styles.formControl} value={String(draft.description ?? '')} onChange={event => updateDraft('description', event.target.value)} /></div>
                                    <div className={`${styles.formGroup} ${styles.full}`}><label htmlFor="galleryImages">Ảnh gallery (mỗi dòng một URL)</label><BookImageUpload onBusyChange={controller.onUploadBusyChange} multiple onUploaded={urls => updateDraft('galleryImages', [draft.galleryImages, ...urls].filter(Boolean).join('\n'))} /><textarea id="galleryImages" rows={3} className={styles.formControl} value={String(draft.galleryImages ?? '')} onChange={event => updateDraft('galleryImages', event.target.value)} /></div>
                                    {editingId && <div className={`${styles.formGroup} ${styles.full}`}><BookEditionUpload onBusyChange={controller.onUploadBusyChange} key={editingId} bookId={editingId} /></div>}
                                </div>
    );
}

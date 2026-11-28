import { Lock, Ban, ChevronDown } from 'lucide-react';
import type { AdminBookStatus } from '../../../types/book';
import { BookImageUpload } from './BookUploadFields';
import type { useBookManagement } from '../../../hooks/useBookManagement';
import styles from './AdminBookManagement.module.css';

export default function BookEditorFields({ controller }: { controller: ReturnType<typeof useBookManagement> }) {
    const {
        categories,
        publishers,
        editingId,
        draft,
        formWarn,
        isCategoryDropdownOpen,
        categoryDropdownRef,
        selectedCategoriesText,
        isRentalDisabled,
        setIsCategoryDropdownOpen,
        updateDraft,
        toggleCategorySelection,
    } = controller;

    // Tính toán trạng thái Xanh / Vàng của từng hình thức phát hành theo ràng buộc thực tế
    const isPhysicalGreen = draft.isPhysicalAvailable === true && (Number(draft.stockCount) || 0) > 0;
    const isPhysicalYellow = draft.isPhysicalAvailable === true && (Number(draft.stockCount) || 0) <= 0;

    const isEBookGreen = draft.isEBookAvailable === true && draft.hasPublishedEbook === true;
    const isEBookYellow = draft.isEBookAvailable === true && !draft.hasPublishedEbook;

    const isRentalGreen = draft.isRentalAvailable === true && draft.hasPublishedEbook === true;
    const isRentalYellow = draft.isRentalAvailable === true && !draft.hasPublishedEbook;

    return (
<div className={styles.formGrid}>
                                    <fieldset className={styles.publicationFormats}>
                                        <legend>Hình thức phát hành</legend>
                                        <div className={styles.publicationOptions}>
                                            <label
                                                className={`${styles.publicationOption} ${isPhysicalGreen ? styles.optionGreen : isPhysicalYellow ? styles.optionYellow : ''}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={draft.isPhysicalAvailable === true}
                                                    onChange={(event) => updateDraft('isPhysicalAvailable', event.target.checked)}
                                                />
                                                <span>Sách giấy</span>
                                                {isPhysicalGreen && <span className={styles.badgeStatusGreen}>Tồn: {draft.stockCount}</span>}
                                                {isPhysicalYellow && <span className={styles.badgeStatusYellow}>Tồn: 0</span>}
                                            </label>

                                            <label
                                                className={`${styles.publicationOption} ${isEBookGreen ? styles.optionGreen : isEBookYellow ? styles.optionYellow : ''}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={draft.isEBookAvailable === true}
                                                    onChange={(event) => updateDraft('isEBookAvailable', event.target.checked)}
                                                />
                                                <span>E-book</span>
                                                {isEBookGreen && <span className={styles.badgeStatusGreen}>Đã có file</span>}
                                                {isEBookYellow && <span className={styles.badgeStatusYellow}>Chưa có file</span>}
                                            </label>

                                            <label
                                                className={`${styles.publicationOption} ${isRentalGreen ? styles.optionGreen : isRentalYellow ? styles.optionYellow : ''}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={draft.isRentalAvailable === true}
                                                    onChange={(event) => updateDraft('isRentalAvailable', event.target.checked)}
                                                />
                                                <span>Thuê đọc</span>
                                                {isRentalGreen && <span className={styles.badgeStatusGreen}>Đã có file</span>}
                                                {isRentalYellow && <span className={styles.badgeStatusYellow}>Chưa có file</span>}
                                            </label>
                                        </div>

                                        {formWarn && (
                                            <div className={styles.formWarn} role="alert">
                                                {formWarn}
                                            </div>
                                        )}
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
                                            value={(draft.status as AdminBookStatus) || 'upcoming'}
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
                                        <label htmlFor="weeklyRentalPrice" className={isRentalDisabled ? styles.lockedLabel : ''}>
                                            Giá thuê theo Tuần (VNĐ) {isRentalDisabled && <Ban size={12} color="#94a3b8" />}
                                        </label>
                                        <input
                                            id="weeklyRentalPrice"
                                            type="number"
                                            disabled={isRentalDisabled}
                                            className={`${styles.formControl} ${isRentalDisabled ? styles.disabledInput : ''}`}
                                            value={isRentalDisabled ? 0 : (draft.weeklyRentalPrice as number) || 0}
                                            onChange={(e) => updateDraft('weeklyRentalPrice', Number(e.target.value))}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="monthlyRentalPrice" className={isRentalDisabled ? styles.lockedLabel : ''}>
                                            Giá thuê theo Tháng (VNĐ) {isRentalDisabled && <Ban size={12} color="#94a3b8" />}
                                        </label>
                                        <input
                                            id="monthlyRentalPrice"
                                            type="number"
                                            disabled={isRentalDisabled}
                                            className={`${styles.formControl} ${isRentalDisabled ? styles.disabledInput : ''}`}
                                            value={isRentalDisabled ? 0 : (draft.monthlyRentalPrice as number) || 0}
                                            onChange={(e) => updateDraft('monthlyRentalPrice', Number(e.target.value))}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="yearlyRentalPrice" className={isRentalDisabled ? styles.lockedLabel : ''}>
                                            Giá thuê theo Năm (VNĐ) {isRentalDisabled && <Ban size={12} color="#94a3b8" />}
                                        </label>
                                        <input
                                            id="yearlyRentalPrice"
                                            type="number"
                                            disabled={isRentalDisabled}
                                            className={`${styles.formControl} ${isRentalDisabled ? styles.disabledInput : ''}`}
                                            value={isRentalDisabled ? 0 : (draft.yearlyRentalPrice as number) || 0}
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
                                </div>
    );
}

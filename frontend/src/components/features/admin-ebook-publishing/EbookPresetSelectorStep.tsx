import React from 'react';
import { Sparkles, Volume2 } from 'lucide-react';
import type { EbookPresetEnum } from '../../../types/ebookPublishing';
import styles from './EbookPublishingModal.module.css';

interface PresetOption {
    value: EbookPresetEnum;
    title: string;
    description: string;
    badge: string;
}

const presetGroups: PresetOption[] = [
    {
        value: 1,
        title: 'Nhóm Văn học',
        description: 'Tác phẩm văn học thuần văn bản (EPUB). Hỗ trợ Trợ lý AI và Giọng đọc số.',
        badge: 'EPUB Chuẩn',
    },
    {
        value: 2,
        title: 'Nhóm Học thuật',
        description: 'Giáo trình, tài liệu chuyên ngành, công thức (PDF). Tập trung Trợ lý AI tra cứu thuật ngữ; không áp dụng Giọng đọc số.',
        badge: 'PDF Văn bản',
    },
    {
        value: 3,
        title: 'Nhóm Thị giác',
        description: 'Tư liệu cổ, bản scan nguyên gốc, sách tranh (Scan/Ảnh). Đọc nguyên bản, ngắt toàn bộ AI & Giọng đọc.',
        badge: 'Bản Scan / Tranh ảnh',
    },
];

interface Props {
    selectedPresetType: EbookPresetEnum;
    isBusy: boolean;
    onSelectPreset: (preset: EbookPresetEnum) => void;
}

export const EbookPresetSelectorStep: React.FC<Props> = ({
    selectedPresetType,
    isBusy,
    onSelectPreset,
}) => {
    return (
        <section className={styles.section} aria-labelledby="ebook-preset-step">
            <h3 id="ebook-preset-step">
                <span>2</span>Phân loại & Nhóm cấu hình ấn bản
            </h3>

            <div className={styles.documentTypes} role="radiogroup" aria-labelledby="ebook-preset-step">
                {presetGroups.map(group => {
                    const isSelected = selectedPresetType === group.value;
                    return (
                        <label
                            key={group.value}
                            className={`${styles.typeCard} ${isSelected ? styles.selected : ''}`}
                        >
                            <input
                                type="radio"
                                name="ebookPresetType"
                                value={group.value}
                                checked={isSelected}
                                onChange={() => onSelectPreset(group.value)}
                                disabled={isBusy}
                            />
                            <div>
                                <strong>{group.title}</strong>
                                <p>{group.description}</p>
                            </div>
                            <div>
                                {group.value === 3 ? (
                                    <span className={styles.readOnly}>Đọc thường (Không AI)</span>
                                ) : group.value === 2 ? (
                                    <div className={styles.capabilities}>
                                        <span><Sparkles size={11} style={{ display: 'inline', marginRight: 3 }} />Trợ lý AI</span>
                                    </div>
                                ) : (
                                    <div className={styles.capabilities}>
                                        <span><Sparkles size={11} style={{ display: 'inline', marginRight: 3 }} />Trợ lý AI</span>
                                        <span><Volume2 size={11} style={{ display: 'inline', marginRight: 3 }} />Giọng đọc số</span>
                                    </div>
                                )}
                            </div>
                        </label>
                    );
                })}
            </div>
        </section>
    );
};

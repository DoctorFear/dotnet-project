import React from 'react';
import { Volume2, Loader2 } from 'lucide-react';
import type { EbookPublishingDraftState } from '../../../types/ebookPublishing';
import styles from './EbookPublishingModal.module.css';

interface Props {
    draft: EbookPublishingDraftState;
    isScan: boolean;
    isBusy: boolean;
    isGeneratingTts: boolean;
    onToggleChatAi: (checked: boolean) => void;
    onToggleTts: (checked: boolean) => void;
    onChangeLanguage: (lang: string) => void;
    onChangeFromPage: (page: string) => void;
    onChangeToPage: (page: string) => void;
    onGenerateAudio: () => void;
}

export const EbookSmartFeaturesStep: React.FC<Props> = ({
    draft,
    isScan,
    isBusy,
    isGeneratingTts,
    onToggleChatAi,
    onToggleTts,
    onChangeLanguage,
    onChangeFromPage,
    onChangeToPage,
    onGenerateAudio,
}) => {
    const unit = draft.format === 'Epub' ? 'chương' : 'trang';

    return (
        <>
            {/* Mục 3: Thiết lập quyền năng đọc thông minh */}
            <section className={styles.section} aria-labelledby="ebook-features-step">
                <h3 id="ebook-features-step">
                    <span>3</span>Thiết lập quyền năng đọc thông minh
                </h3>

                <div className={styles.features}>
                    <label className={styles.feature}>
                        <div>
                            <strong>Trợ lý đọc sách thông minh (AI Copilot)</strong>
                            <p>Cho phép độc giả bôi đen đoạn văn để hỏi đáp hoặc giải nghĩa nội dung dựa trên chỉ mục tri thức RAG.</p>
                        </div>
                        <input
                            className={styles.toggle}
                            type="checkbox"
                            role="switch"
                            aria-label="Trợ lý đọc sách thông minh"
                            checked={!isScan && draft.chatAiEnabled}
                            disabled={isScan || isBusy}
                            onChange={e => onToggleChatAi(e.target.checked)}
                        />
                    </label>

                    <label className={styles.feature}>
                        <div>
                            <strong>Giọng đọc số (Text-to-Speech)</strong>
                            <p>Hiển thị trình phát giọng đọc số thông minh theo từng trang sách hoặc chương mục.</p>
                        </div>
                        <input
                            className={styles.toggle}
                            type="checkbox"
                            role="switch"
                            aria-label="Giọng đọc số"
                            checked={!isScan && draft.ttsEnabled}
                            disabled={isScan || isBusy}
                            onChange={e => onToggleTts(e.target.checked)}
                        />
                    </label>
                </div>
            </section>

            {/* Mục 4: Cấu hình Giọng đọc số TTS */}
            <section className={styles.section} aria-labelledby="ebook-tts-step">
                <h3 id="ebook-tts-step">
                    <span>4</span>Cấu hình Giọng đọc số (TTS)
                </h3>

                <fieldset className={styles.ttsFields} disabled={isScan || !draft.ttsEnabled || isBusy}>
                    <label>
                        Ngôn ngữ đọc
                        <select
                            value={draft.ttsLanguage}
                            onChange={e => onChangeLanguage(e.target.value)}
                        >
                            <option value="vi">Tiếng Việt</option>
                            <option value="en">Tiếng Anh</option>
                            <option value="fr">Tiếng Pháp</option>
                            <option value="ja">Tiếng Nhật</option>
                            <option value="zh">Tiếng Trung</option>
                        </select>
                    </label>

                    <label>
                        Từ {unit}
                        <input
                            type="number"
                            min="1"
                            step="1"
                            value={draft.ttsFromPage}
                            onChange={e => onChangeFromPage(e.target.value)}
                        />
                    </label>

                    <label>
                        Đến {unit}
                        <input
                            type="number"
                            min={Number(draft.ttsFromPage) || 1}
                            step="1"
                            placeholder="Cuối ấn bản"
                            value={draft.ttsToPage}
                            onChange={e => onChangeToPage(e.target.value)}
                        />
                    </label>
                </fieldset>

                <div className={styles.audioActions}>
                    <p>
                        {isScan
                            ? 'Nhóm tư liệu thị giác / scan không hỗ trợ chuyển đổi giọng đọc số.'
                            : 'Bạn có thể chủ động tạo sẵn dữ liệu âm thanh AI theo khoảng trang để độc giả nghe mượt mà.'}
                    </p>
                    <div>
                        <button
                            type="button"
                            className={styles.outlineButton}
                            disabled={isScan || !draft.ttsEnabled || !draft.editionId || isBusy}
                            onClick={onGenerateAudio}
                        >
                            {isGeneratingTts ? (
                                <>
                                    <Loader2 size={14} className={styles.spinner} /> Đang tạo âm thanh...
                                </>
                            ) : (
                                <>
                                    <Volume2 size={14} /> Tạo giọng đọc AI
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </section>
        </>
    );
};

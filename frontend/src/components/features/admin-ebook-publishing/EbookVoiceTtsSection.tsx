import React, { useState } from 'react';
import { Volume2, Play, Square, Loader2, ChevronDown, ChevronUp, Music, CheckCircle2, XCircle } from 'lucide-react';
import type { PageTtsSegment } from '../../../types/ebookPublishing';
import styles from './EbookPublishingModal.module.css';

interface Props {
    ttsEnabled: boolean;
    isScan: boolean;
    isBusy: boolean;
    isGeneratingTts: boolean;
    editionId: number | null;
    unit: string;
    previewSegments: PageTtsSegment[];
    previewPage: number;
    isLoadingSegments: boolean;
    playingAudioUrl: string | null;
    onGenerateAudio: () => void;
    onLoadPreviewSegments: (page: number) => void;
    onPlayAudio: (url: string) => void;
}

export const EbookVoiceTtsSection: React.FC<Props> = ({
    ttsEnabled,
    isScan,
    isBusy,
    isGeneratingTts,
    editionId,
    unit,
    previewSegments,
    previewPage,
    isLoadingSegments,
    playingAudioUrl,
    onGenerateAudio,
    onLoadPreviewSegments,
    onPlayAudio,
}) => {
    const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
    const [selectedPageInput, setSelectedPageInput] = useState<string>(previewPage.toString());

    return (
        <section className={styles.section} aria-labelledby="ebook-tts-step">
            <h3 id="ebook-tts-step">
                <span>4</span>Cấu hình Giọng đọc số (E-Book Voice TTS)
            </h3>

            <div className={styles.features} style={{ marginBottom: '14px' }}>
                <div className={styles.feature} style={{ cursor: 'default' }}>
                    <div>
                        <strong>Kích hoạt Giọng đọc số (Text-to-Speech)</strong>
                        <p>
                            Tự động hiển thị trình phát âm thanh AI theo từng trang sách hoặc chương mục trên ứng dụng đọc của độc giả.
                        </p>
                    </div>
                    <div>
                        {!isScan && ttsEnabled ? (
                            <span className={styles.badgeSuccess} title="Tự động bật theo cấu hình chuẩn của Nhóm Văn học">
                                <CheckCircle2 size={12} style={{ display: 'inline', marginRight: 3 }} /> Bật mặc định
                            </span>
                        ) : (
                            <span className={styles.badgeNone} title="Phân loại hiện tại không áp dụng Giọng đọc số">
                                <XCircle size={12} style={{ display: 'inline', marginRight: 3 }} /> Không áp dụng
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {!isScan && ttsEnabled ? (
                <>
                    {/* Thông số cấu hình mặc định chuẩn theo phân loại */}
                    <div className={styles.defaultConfigBox}>
                        <div className={styles.defaultConfigItem}>
                            <span className={styles.defaultConfigLabel}>Ngôn ngữ đọc mặc định</span>
                            <span className={styles.defaultConfigValue}>Tiếng Việt (Neural Voice)</span>
                        </div>
                        <div className={styles.defaultConfigItem}>
                            <span className={styles.defaultConfigLabel}>Đa giọng đọc tích hợp</span>
                            <span className={styles.defaultConfigValue}>Giọng Nữ & Giọng Nam</span>
                        </div>
                        <div className={styles.defaultConfigItem}>
                            <span className={styles.defaultConfigLabel}>Phạm vi số hóa mặc định</span>
                            <span className={styles.defaultConfigValue}>Toàn bộ các {unit} (Từ đầu đến cuối)</span>
                        </div>
                    </div>

                    <div className={styles.audioActions}>
                        <p>
                            Chuyên viên Staff có thể bấm tạo sẵn dữ liệu âm thanh AI hoặc nghe thử các câu đã sinh trên đám mây.
                        </p>
                        <div>
                            <button
                                type="button"
                                className={styles.outlineButton}
                                disabled={!editionId || isBusy}
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
                </>
            ) : (
                <div className={styles.disabledNoticeBox}>
                    <p style={{ margin: 0 }}>
                        {isScan
                            ? '● Nhóm tư liệu thị giác / scan nguyên bản: Giữ nguyên vẹn hình thức trực quan, không áp dụng chuyển đổi giọng đọc số theo chuẩn phân loại.'
                            : '● Nhóm tài liệu học thuật / chuyên ngành: Tập trung vào nội dung văn bản và tra cứu thuật ngữ với Trợ lý AI, không áp dụng Giọng đọc số theo chuẩn phân loại.'}
                    </p>
                </div>
            )}

            {/* Khung nghe thử nghiệm thu âm thanh đã sinh cho Staff */}
            {editionId && !isScan && (
                <div className={styles.testerContainer}>
                    <button
                        type="button"
                        className={styles.testerToggleBtn}
                        onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                    >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Music size={14} color="#047857" />
                            <strong>Nghe thử & Nghiệm thu đoạn âm thanh (Audio Preview)</strong>
                        </span>
                        {isPreviewOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {isPreviewOpen && (
                        <div className={styles.testerBody}>
                            <div className={styles.testerInputRow}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                                    Chọn {unit} để nghe thử:
                                    <input
                                        type="number"
                                        min="1"
                                        style={{ width: '70px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                        value={selectedPageInput}
                                        onChange={e => setSelectedPageInput(e.target.value)}
                                    />
                                </label>
                                <button
                                    type="button"
                                    className={styles.secondaryButton}
                                    style={{ padding: '5px 12px', fontSize: '12px' }}
                                    onClick={() => onLoadPreviewSegments(Number(selectedPageInput) || 1)}
                                    disabled={isLoadingSegments || isBusy}
                                >
                                    {isLoadingSegments ? <Loader2 size={13} className={styles.spinner} /> : 'Tải đoạn đọc'}
                                </button>
                            </div>

                            {previewSegments.length > 0 ? (
                                <div className={styles.segmentList}>
                                    {previewSegments.map(seg => (
                                        <div key={seg.segmentIndex} className={styles.segmentCard}>
                                            <div className={styles.segmentText}>
                                                <small style={{ color: '#64748b' }}>Đoạn #{seg.segmentIndex + 1}:</small>
                                                <p style={{ margin: '2px 0 0 0', fontSize: '12px' }}>{seg.textContent}</p>
                                            </div>
                                            <div className={styles.segmentAudios}>
                                                {seg.audioUrlFemale && (
                                                    <button
                                                        type="button"
                                                        className={styles.audioPlayBtn}
                                                        onClick={() => onPlayAudio(seg.audioUrlFemale)}
                                                        title="Nghe giọng Nữ"
                                                    >
                                                        {playingAudioUrl === seg.audioUrlFemale ? (
                                                            <Square size={11} fill="#047857" />
                                                        ) : (
                                                            <Play size={11} fill="#047857" />
                                                        )}
                                                        <span>Nữ</span>
                                                    </button>
                                                )}
                                                {seg.audioUrlMale && (
                                                    <button
                                                        type="button"
                                                        className={styles.audioPlayBtn}
                                                        onClick={() => onPlayAudio(seg.audioUrlMale)}
                                                        title="Nghe giọng Nam"
                                                    >
                                                        {playingAudioUrl === seg.audioUrlMale ? (
                                                            <Square size={11} fill="#1e40af" />
                                                        ) : (
                                                            <Play size={11} fill="#1e40af" />
                                                        )}
                                                        <span>Nam</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className={styles.mutedNotice}>
                                    {unit === 'chương' ? 'Chương' : 'Trang'} này chưa có đoạn âm thanh nào được sinh. Vui lòng bấm “Tạo giọng đọc AI” ở trên để sinh dữ liệu.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};

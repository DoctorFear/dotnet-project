import React, { useEffect, useRef } from 'react';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import type { useEbookPublishing } from '../../../hooks/useEbookPublishing';
import { EbookModalHeader } from './EbookModalHeader';
import { EbookFileUploadStep } from './EbookFileUploadStep';
import { EbookPresetSelectorStep } from './EbookPresetSelectorStep';
import { EbookAiCopilotSection } from './EbookAiCopilotSection';
import { EbookVoiceTtsSection } from './EbookVoiceTtsSection';
import { EbookModalFooter } from './EbookModalFooter';
import styles from './EbookPublishingModal.module.css';

interface Props {
    controller: ReturnType<typeof useEbookPublishing>;
}

export const EbookPublishingModal: React.FC<Props> = ({ controller }) => {
    const dialogRef = useRef<HTMLDialogElement>(null);

    const {
        book,
        draft,
        isLoading,
        isUploading,
        isPublishing,
        isUnpublishing,
        showUnpublishConfirm,
        setShowUnpublishConfirm,
        unpublish,
        isGeneratingTts,
        progressStage,
        error,
        notice,
        isDragging,
        setIsDragging,
        close,
        selectPresetType,
        selectFile,
        saveDraft,
        publish,
        generateAudio,
        // TTS audio preview
        previewSegments,
        previewPage,
        isLoadingSegments,
        playingAudioUrl,
        loadPreviewSegments,
        playAudio,
        // Copilot testing
        copilotQuestion,
        setCopilotQuestion,
        copilotResponse,
        isTestingCopilot,
        testCopilot,
    } = controller;

    useEffect(() => {
        const element = dialogRef.current;
        const previousOverflow = document.body.style.overflow;
        element?.showModal();
        document.body.style.overflow = 'hidden';

        return () => {
            element?.close();
            document.body.style.overflow = previousOverflow;
        };
    }, []);

    if (!book) return null;

    const isScan = draft.presetType === 3;
    const isBusy = isLoading || isUploading || isPublishing || isUnpublishing || isGeneratingTts;
    const isPublished = draft.status === 'Published';
    const unit = draft.format === 'Epub' ? 'chương' : 'trang';

    return (
        <dialog
            ref={dialogRef}
            className={styles.modal}
            aria-labelledby="ebook-publishing-title"
            onCancel={e => {
                e.preventDefault();
                if (!isBusy) close();
            }}
        >
            {/* Header: Tiêu đề, thông tin sách, huy hiệu trạng thái & nút đóng */}
            <EbookModalHeader
                book={book}
                editionId={draft.editionId}
                status={draft.status}
                isBusy={isBusy}
                onClose={close}
            />

            <div className={styles.body}>
                {/* Banner thông báo trạng thái phát hành */}
                {isPublished ? (
                    <div className={`${styles.banner} ${styles.bannerPublished}`}>
                        <CheckCircle2 size={16} />
                        <span>Ấn bản điện tử đã được phát hành chính thức trên nền tảng. Độc giả đã có thể đọc sách online.</span>
                    </div>
                ) : (
                    <div className={styles.banner}>
                        <AlertCircle size={16} />
                        <span>Chưa xuất bản: Khách hàng chưa thể đọc online cho đến khi chuyên viên bấm “Xuất bản”. Sách giấy vẫn bán bình thường.</span>
                    </div>
                )}

                {/* Hộp hiển thị lộ trình nạp tri thức khi xuất bản */}
                {progressStage && (
                    <div className={styles.progressBox} role="status">
                        <div className={styles.spinner} />
                        <div>
                            <strong>Tiến trình xử lý:</strong>
                            <div>{progressStage}</div>
                        </div>
                    </div>
                )}

                {/* 1. Bước Tải tệp nội dung số (PDF / EPUB) */}
                <EbookFileUploadStep
                    draft={draft}
                    isUploading={isUploading}
                    isBusy={isBusy}
                    isDragging={isDragging}
                    onDragOver={() => setIsDragging(true)}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={selectFile}
                    onFileSelected={selectFile}
                />

                {/* 2. Bước Phân loại & Nhóm cấu hình ấn bản (Văn học, Học thuật, Thị giác) */}
                <EbookPresetSelectorStep
                    selectedPresetType={draft.presetType}
                    isBusy={isBusy}
                    onSelectPreset={selectPresetType}
                />

                {/* 3. Phân hệ E-Book AI: Trợ lý AI (Cấu hình mặc định theo phân loại) & Hộp test hỏi đáp */}
                <EbookAiCopilotSection
                    chatAiEnabled={draft.chatAiEnabled}
                    isScan={isScan}
                    isBusy={isBusy}
                    totalEmbeddings={draft.totalEmbeddings}
                    editionId={draft.editionId}
                    isPublished={isPublished}
                    copilotQuestion={copilotQuestion}
                    copilotResponse={copilotResponse}
                    isTestingCopilot={isTestingCopilot}
                    onChangeQuestion={setCopilotQuestion}
                    onTestCopilot={testCopilot}
                />

                {/* 4. Phân hệ E-Book Voice: Giọng đọc số (Cấu hình mặc định theo phân loại) & Khay nghe thử */}
                <EbookVoiceTtsSection
                    ttsEnabled={draft.ttsEnabled}
                    isScan={isScan}
                    isBusy={isBusy}
                    isGeneratingTts={isGeneratingTts}
                    editionId={draft.editionId}
                    unit={unit}
                    previewSegments={previewSegments}
                    previewPage={previewPage}
                    isLoadingSegments={isLoadingSegments}
                    playingAudioUrl={playingAudioUrl}
                    onGenerateAudio={generateAudio}
                    onLoadPreviewSegments={loadPreviewSegments}
                    onPlayAudio={playAudio}
                />

                {/* Thông báo lỗi & kết quả */}
                {error && (
                    <div className={styles.error} role="alert">
                        <strong>Lỗi:</strong> {error}
                    </div>
                )}
                {notice && (
                    <div className={styles.notice} role="status">
                        <CheckCircle2 size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
                        {notice}
                    </div>
                )}
            </div>

            {/* Footer: Lưu nháp, Xuất bản, Gỡ E-Book, Ngày giờ lưu lần cuối */}
            <EbookModalFooter
                savedAt={draft.savedAt}
                editionId={draft.editionId}
                bookId={book.id}
                hasPendingFile={Boolean(draft.file)}
                isPublishing={isPublishing}
                isBusy={isBusy}
                onClose={close}
                onSaveDraft={saveDraft}
                onPublish={publish}
                onRequestUnpublish={() => setShowUnpublishConfirm(true)}
            />

            {/* Hộp thoại xác nhận gỡ ấn bản E-Book */}
            {showUnpublishConfirm && (
                <div className={styles.confirmOverlay}>
                    <div className={styles.confirmModal}>
                        <div className={styles.confirmHeader}>
                            <AlertCircle size={22} color="#dc2626" />
                            <h4>Xác nhận gỡ ấn bản E-Book</h4>
                        </div>
                        <p className={styles.confirmBody}>
                            Bạn có chắc chắn muốn gỡ ấn bản E-Book khỏi sách <strong>"{book.title}"</strong> không?
                            <br /><br />
                            Toàn bộ tệp số hóa (PDF/EPUB), các đoạn chỉ mục AI Copilot (RAG) và giọng đọc số TTS đã nạp sẽ bị xóa hoàn toàn khỏi hệ thống.
                        </p>
                        <div className={styles.confirmActions}>
                            <button
                                type="button"
                                className={styles.secondaryButton}
                                onClick={() => setShowUnpublishConfirm(false)}
                                disabled={isUnpublishing}
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                className={styles.dangerSolidButton}
                                onClick={unpublish}
                                disabled={isUnpublishing}
                            >
                                {isUnpublishing ? (
                                    <>
                                        <Loader2 size={14} className={styles.spinner} /> Đang gỡ...
                                    </>
                                ) : (
                                    'Đồng ý gỡ E-Book'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </dialog>
    );
};

export default EbookPublishingModal;

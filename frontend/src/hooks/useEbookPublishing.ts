import { useState, useCallback, useRef } from 'react';
import type { AdminBookData } from '../types/book';
import type {
    EbookPresetEnum,
    EbookPublishingDraftState,
    EbookFormatType,
    PageTtsSegment,
    CopilotTestResponse
} from '../types/ebookPublishing';
import { ebookPublishingService } from '../services/ebookPublishingService';

const createEmptyDraft = (): EbookPublishingDraftState => ({
    editionId: null,
    file: null,
    fileTitle: '',
    format: null,
    fileSizeBytes: 0,
    totalPages: 0,
    presetType: 1, // Mặc định 1: Nhóm Văn học / EPUB
    chatAiEnabled: true,
    ttsEnabled: true,
    ttsLanguage: 'vi',
    ttsFromPage: '1',
    ttsToPage: '',
    status: null,
    publishedAt: null,
    totalEmbeddings: 0,
    savedAt: null,
});

export const useEbookPublishing = (onChanged?: () => void) => {
    const [book, setBook] = useState<AdminBookData | null>(null);
    const [draft, setDraft] = useState<EbookPublishingDraftState>(createEmptyDraft());
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [isPublishing, setIsPublishing] = useState<boolean>(false);
    const [isUnpublishing, setIsUnpublishing] = useState<boolean>(false);
    const [showUnpublishConfirm, setShowUnpublishConfirm] = useState<boolean>(false);
    const [isGeneratingTts, setIsGeneratingTts] = useState<boolean>(false);
    const [progressStage, setProgressStage] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [notice, setNotice] = useState<string>('');
    const [isDragging, setIsDragging] = useState<boolean>(false);

    // TTS Audio preview state
    const [previewSegments, setPreviewSegments] = useState<PageTtsSegment[]>([]);
    const [previewPage, setPreviewPage] = useState<number>(1);
    const [isLoadingSegments, setIsLoadingSegments] = useState<boolean>(false);
    const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

    // AI Copilot test state for Staff
    const [copilotQuestion, setCopilotQuestion] = useState<string>('');
    const [copilotResponse, setCopilotResponse] = useState<CopilotTestResponse | null>(null);
    const [isTestingCopilot, setIsTestingCopilot] = useState<boolean>(false);

    const stopAudio = useCallback(() => {
        if (audioPlayerRef.current) {
            audioPlayerRef.current.pause();
            audioPlayerRef.current.src = '';
            audioPlayerRef.current = null;
        }
        setPlayingAudioUrl(null);
    }, []);

    const playAudio = useCallback((url: string) => {
        if (!url) return;
        const directUrl = url
            .replace('www.dropbox.com', 'dl.dropboxusercontent.com')
            .replace('dropbox.com', 'dl.dropboxusercontent.com');

        if (playingAudioUrl === directUrl) {
            stopAudio();
            return;
        }
        stopAudio();
        const audio = new Audio(directUrl);
        audio.preload = 'auto';
        audioPlayerRef.current = audio;
        setPlayingAudioUrl(directUrl);

        audio.onended = () => {
            setPlayingAudioUrl(null);
        };
        audio.onerror = () => {
            setPlayingAudioUrl(null);
            setError('Không thể phát tệp âm thanh. Vui lòng kiểm tra lại liên kết Dropbox.');
        };
        void audio.play();
    }, [playingAudioUrl, stopAudio]);

    // Mở modal và kiểm tra ấn bản hiện tại của sách từ Backend
    const open = useCallback(async (selectedBook: AdminBookData) => {
        setBook(selectedBook);
        setError('');
        setNotice('');
        setProgressStage('');
        setPreviewSegments([]);
        setCopilotResponse(null);
        setCopilotQuestion('');
        stopAudio();
        setIsLoading(true);

        try {
            const result = await ebookPublishingService.getEditionByBookId(selectedBook.id);
            if (result.hasEdition && result.edition) {
                const ed = result.edition;
                const isScan = ed.presetType === 3;
                setDraft({
                    editionId: ed.id,
                    file: null,
                    fileTitle: ed.fileTitle,
                    format: ed.format,
                    fileSizeBytes: ed.fileSizeBytes,
                    totalPages: ed.totalPages,
                    presetType: ed.presetType,
                    chatAiEnabled: !isScan,
                    ttsEnabled: !isScan && ed.isTtsEnabled,
                    ttsLanguage: 'vi',
                    ttsFromPage: '1',
                    ttsToPage: '',
                    status: ed.statusName,
                    publishedAt: ed.publishedAt,
                    totalEmbeddings: ed.totalEmbeddings,
                    savedAt: ed.updatedAt || ed.createdAt,
                });

                // Nếu đã có TTS, tự động lấy thử các đoạn của trang 1
                if (ed.isTtsEnabled) {
                    try {
                        const segments = await ebookPublishingService.getPageSegments(ed.id, 1);
                        setPreviewSegments(segments);
                        setPreviewPage(1);
                    } catch {
                        // ignore preview error
                    }
                }
            } else {
                setDraft(createEmptyDraft());
            }
        } catch (err: any) {
            setDraft(createEmptyDraft());
            setError(err.message || 'Không thể tải thông tin ấn bản E-Book.');
        } finally {
            setIsLoading(false);
        }
    }, [stopAudio]);

    const close = useCallback(() => {
        stopAudio();
        setBook(null);
        setError('');
        setNotice('');
        setProgressStage('');
    }, [stopAudio]);

    const selectPresetType = useCallback((type: EbookPresetEnum) => {
        setError('');
        setNotice('');
        setDraft(current => ({
            ...current,
            presetType: type,
            // Quy tắc tự động của hệ thống (Bước 6 Use Case & BR-01):
            // Nhóm 1 (Văn học): Hỗ trợ đầy đủ cả Trợ lý AI và Giọng đọc số
            // Nhóm 2 (Học thuật): Tập trung Trợ lý AI, không áp dụng Giọng đọc số
            // Nhóm 3 (Thị giác/Scan): Ngắt toàn bộ tương tác thông minh
            chatAiEnabled: type !== 3,
            ttsEnabled: type === 1,
        }));
    }, []);

    const changeField = useCallback(<K extends keyof EbookPublishingDraftState>(key: K, value: EbookPublishingDraftState[K]) => {
        setDraft(current => ({ ...current, [key]: value }));
        setError('');
        setNotice('');
    }, []);

    // Xử lý chọn tệp E-Book (Chỉ lưu tạm vào draft bộ nhớ, CHƯA upload lên Dropbox để tránh bấm nhầm)
    const selectFile = useCallback((files: FileList | null) => {
        setIsDragging(false);
        setError('');
        setNotice('');

        if (!book) return;
        if (!files?.length) return;
        if (files.length > 1) {
            setError('Vui lòng chỉ chọn duy nhất một tệp ấn bản điện tử.');
            return;
        }

        const file = files[0];
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (extension !== 'pdf' && extension !== 'epub') {
            setError('Định dạng tệp không hợp lệ. Hệ thống chỉ chấp nhận tệp .pdf hoặc .epub.');
            return;
        }

        if (file.size === 0) {
            setError('Tệp đã chọn không có nội dung.');
            return;
        }

        if (file.size > 104_857_600) {
            setError('Dung lượng tệp vượt quá hạn mức tối đa cho phép (100MB). Vui lòng tối ưu hóa trước khi tải lại.');
            return;
        }

        const format: EbookFormatType = extension === 'epub' ? 'Epub' : 'Pdf';
        const suggestedPreset: EbookPresetEnum = format === 'Epub' ? 1 : 2;

        setDraft(current => ({
            ...current,
            file,
            fileTitle: file.name,
            format,
            fileSizeBytes: file.size,
            presetType: current.editionId ? current.presetType : suggestedPreset,
            chatAiEnabled: (current.editionId ? current.presetType : suggestedPreset) !== 3,
            ttsEnabled: (current.editionId ? current.presetType : suggestedPreset) === 1,
        }));

        setNotice(`Đã chọn tệp "${file.name}" (${(file.size / (1024 * 1024)).toFixed(2)} MB). Bấm "Lưu bản nháp" hoặc "Xuất bản" để xác nhận lưu lên hệ thống.`);
    }, [book]);

    // Luồng rẽ nhánh A1: Lưu bản nháp (Save as Draft)
    const saveDraft = useCallback(async () => {
        if (!draft.editionId && !draft.file) {
            setError('Vui lòng chọn tệp nội dung số trước khi lưu bản nháp.');
            return;
        }

        if (!book) return;

        setError('');
        setNotice('');
        setIsLoading(true);

        try {
            let targetEditionId = draft.editionId;

            // Nếu có tệp mới vừa chọn: Tiến hành upload (Backend sẽ tự xóa file cũ trên Dropbox nếu có trước khi tải file mới)
            if (draft.file) {
                setIsUploading(true);
                setProgressStage('Đang đồng bộ tệp lên đám mây Dropbox...');
                try {
                    const uploadRes = await ebookPublishingService.uploadEdition(book.id, draft.file);
                    targetEditionId = uploadRes.editionId;
                    const format: EbookFormatType = uploadRes.format.toLowerCase() === 'epub' ? 'Epub' : 'Pdf';

                    setDraft(current => ({
                        ...current,
                        editionId: uploadRes.editionId,
                        file: null, // Đã upload xong
                        fileTitle: uploadRes.fileTitle,
                        format,
                        fileSizeBytes: uploadRes.fileSizeBytes,
                        totalPages: uploadRes.totalPages,
                    }));
                } finally {
                    setIsUploading(false);
                }
            }

            if (!targetEditionId) {
                throw new Error('Không thể khởi tạo ấn bản E-Book.');
            }

            await ebookPublishingService.saveDraft(targetEditionId, draft.presetType);
            const now = new Date().toISOString();
            setDraft(current => ({ ...current, status: 'Draft', savedAt: now }));
            setNotice('Đã lưu bản nháp cấu hình E-Book và cập nhật tệp trên Dropbox thành công.');
            onChanged?.();
        } catch (err: any) {
            setError(err.message || 'Không thể lưu bản nháp.');
        } finally {
            setIsLoading(false);
            setProgressStage('');
        }
    }, [draft.editionId, draft.file, draft.presetType, book, onChanged]);

    // Luồng chính Bước 7 & 8: Xuất bản ấn bản (Publish)
    const publish = useCallback(async () => {
        if (!draft.editionId && !draft.file) {
            setError('Vui lòng chọn tệp nội dung số trước khi xuất bản.');
            return;
        }

        if (!book) return;

        setError('');
        setNotice('');
        setIsPublishing(true);

        try {
            let targetEditionId = draft.editionId;

            // Nếu có tệp mới vừa chọn chưa lưu nháp: Upload lên Dropbox trước (Backend sẽ xóa tệp cũ trên Dropbox trước)
            if (draft.file) {
                setIsUploading(true);
                setProgressStage('Đang đồng bộ tệp lên đám mây Dropbox trước khi xuất bản...');
                try {
                    const uploadRes = await ebookPublishingService.uploadEdition(book.id, draft.file);
                    targetEditionId = uploadRes.editionId;
                    const format: EbookFormatType = uploadRes.format.toLowerCase() === 'epub' ? 'Epub' : 'Pdf';

                    setDraft(current => ({
                        ...current,
                        editionId: uploadRes.editionId,
                        file: null,
                        fileTitle: uploadRes.fileTitle,
                        format,
                        fileSizeBytes: uploadRes.fileSizeBytes,
                        totalPages: uploadRes.totalPages,
                    }));
                } finally {
                    setIsUploading(false);
                }
            }

            if (!targetEditionId) {
                throw new Error('Không thể khởi tạo ấn bản E-Book để xuất bản.');
            }

            if (draft.presetType === 3) {
                setProgressStage('Đang hoàn tất phát hành ấn bản tài liệu thị giác...');
            } else if (draft.presetType === 1) {
                setProgressStage('Đang trích xuất nội dung, nạp chỉ mục AI (RAG) và tạo giọng đọc số TTS...');
            } else {
                setProgressStage('Đang trích xuất nội dung, phân đoạn và lập chỉ mục tri thức AI (RAG Embedding)...');
            }

            await ebookPublishingService.publishEdition(targetEditionId, draft.presetType);
            const now = new Date().toISOString();

            let totalEmbeddings = 0;
            let isTtsEnabled = draft.ttsEnabled;
            try {
                const updated = await ebookPublishingService.getEditionById(targetEditionId);
                totalEmbeddings = updated.totalEmbeddings;
                isTtsEnabled = updated.isTtsEnabled;
            } catch {
                // ignore
            }

            setDraft(current => ({
                ...current,
                editionId: targetEditionId,
                status: 'Published',
                publishedAt: now,
                totalEmbeddings,
                ttsEnabled: isTtsEnabled,
                savedAt: now,
            }));

            if (isTtsEnabled) {
                try {
                    const segments = await ebookPublishingService.getPageSegments(targetEditionId, 1);
                    setPreviewSegments(segments);
                    setPreviewPage(1);
                } catch {
                    // ignore preview fetch error
                }
            }

            setNotice(
                isTtsEnabled
                    ? 'Xuất bản ấn bản điện tử và tạo giọng đọc AI thành công!'
                    : 'Xuất bản ấn bản điện tử thành công! Độc giả đã có thể đọc sách trên nền tảng.'
            );
            onChanged?.();
        } catch (err: any) {
            setError(err.message || 'Xuất bản thất bại trong quá trình nạp tri thức AI.');
        } finally {
            setIsPublishing(false);
            setProgressStage('');
        }
    }, [draft.editionId, draft.file, draft.presetType, book, onChanged]);

    // Luồng Gỡ bỏ / Hủy xuất bản E-Book (Unpublish / Delete Edition)
    const unpublish = useCallback(async () => {
        if (!draft.editionId && !book?.id) {
            setError('Không tìm thấy ấn bản E-Book để gỡ.');
            return false;
        }

        setError('');
        setNotice('');
        setIsUnpublishing(true);
        setProgressStage('Đang gỡ bỏ ấn bản E-Book và dọn dẹp dữ liệu số hóa...');

        try {
            if (draft.editionId) {
                await ebookPublishingService.deleteEdition(draft.editionId);
            } else if (book?.id) {
                await ebookPublishingService.deleteEditionsByBookId(book.id);
            }

            stopAudio();
            setPreviewSegments([]);
            setCopilotResponse(null);
            setDraft(createEmptyDraft());
            setShowUnpublishConfirm(false);
            setNotice('Đã gỡ ấn bản E-Book thành công. Đầu sách đã được đưa về trạng thái chưa số hóa.');
            onChanged?.();
            return true;
        } catch (err: any) {
            setError(err.message || 'Không thể gỡ bỏ ấn bản E-Book.');
            return false;
        } finally {
            setIsUnpublishing(false);
            setProgressStage('');
        }
    }, [draft.editionId, book?.id, stopAudio, onChanged]);

    // Kích hoạt sinh giọng đọc số AI TTS
    const generateAudio = useCallback(async () => {
        if (!draft.editionId) {
            setError('Chưa có ấn bản sách để tạo giọng đọc.');
            return;
        }

        if (draft.presetType !== 1) {
            setError('Theo quy chuẩn phân loại, Giọng đọc số chỉ áp dụng cho Nhóm Văn học.');
            return;
        }

        const fromPage = 1;
        const toPage = undefined;

        setError('');
        setNotice('');
        setIsGeneratingTts(true);

        try {
            const res = await ebookPublishingService.generateTts(draft.editionId, {
                language: draft.ttsLanguage,
                fromPage,
                toPage,
            });
            setDraft(current => ({ ...current, ttsEnabled: true }));
            setNotice(`Tạo giọng đọc AI thành công! Tổng số đoạn âm thanh đã sinh: ${res.totalSegmentsGenerated}.`);

            // Tự động load preview các đoạn audio vừa tạo của trang bắt đầu
            try {
                const segments = await ebookPublishingService.getPageSegments(draft.editionId, fromPage);
                setPreviewSegments(segments);
                setPreviewPage(fromPage);
            } catch {
                // ignore
            }
        } catch (err: any) {
            setError(err.message || 'Không thể tạo giọng đọc cho các trang đã chọn.');
        } finally {
            setIsGeneratingTts(false);
        }
    }, [draft.editionId, draft.presetType, draft.ttsFromPage, draft.ttsToPage, draft.ttsLanguage]);

    // Staff tải danh sách đoạn audio TTS của một trang để nghe thử
    const loadPreviewSegments = useCallback(async (page: number) => {
        if (!draft.editionId) return;
        setIsLoadingSegments(true);
        setError('');
        try {
            const segments = await ebookPublishingService.getPageSegments(draft.editionId, page);
            setPreviewSegments(segments);
            setPreviewPage(page);
        } catch (err: any) {
            setError(err.message || `Không thể tải đoạn audio của trang ${page}.`);
        } finally {
            setIsLoadingSegments(false);
        }
    }, [draft.editionId]);

    // Staff test thử hỏi đáp AI Copilot trên ấn bản
    const testCopilot = useCallback(async (question: string) => {
        if (!draft.editionId) {
            setError('Chưa có ấn bản sách để kiểm tra AI Copilot.');
            return;
        }
        if (!question.trim()) {
            setError('Vui lòng nhập câu hỏi kiểm tra.');
            return;
        }

        setError('');
        setIsTestingCopilot(true);
        try {
            const res = await ebookPublishingService.testCopilot(draft.editionId, question.trim());
            setCopilotResponse(res);
        } catch (err: any) {
            setError(err.message || 'Lỗi khi gọi kiểm tra AI Copilot.');
        } finally {
            setIsTestingCopilot(false);
        }
    }, [draft.editionId]);

    const generateFileFromChapters = useCallback(
        async (payload: {
            fileTitle: string;
            format: 'Epub' | 'Pdf';
            chapters: { title: string; content: string }[];
        }) => {
            if (!book) return false;
            if (!payload.fileTitle.trim()) {
                setError('Vui lòng nhập tên tệp E-Book.');
                return false;
            }
            const validChapters = payload.chapters.filter(
                c => c.title.trim() && c.content.trim()
            );
            if (validChapters.length === 0) {
                setError('Vui lòng nhập tiêu đề và nội dung cho ít nhất 1 chương.');
                return false;
            }

            setError('');
            setNotice('');
            setIsUploading(true);
            setProgressStage('Đang khởi tạo tệp E-Book và đồng bộ lên đám mây Dropbox...');

            try {
                const res = await ebookPublishingService.generateEditionFile({
                    bookId: book.id,
                    fileTitle: payload.fileTitle.trim(),
                    format: payload.format,
                    author: book.author,
                    chapters: validChapters,
                });

                const format: EbookFormatType =
                    res.format.toLowerCase() === 'epub' ? 'Epub' : 'Pdf';
                const suggestedPreset: EbookPresetEnum = format === 'Epub' ? 1 : 2;

                setDraft(current => ({
                    ...current,
                    editionId: res.editionId,
                    file: null,
                    fileTitle: res.fileTitle,
                    format,
                    fileSizeBytes: res.fileSizeBytes,
                    totalPages: res.totalPages,
                    presetType: suggestedPreset,
                    chatAiEnabled: true,
                    ttsEnabled: suggestedPreset === 1,
                    status: 'Draft',
                    savedAt: new Date().toISOString(),
                }));

                setNotice(
                    `Đã tạo tệp "${res.fileTitle}" (${res.totalPages} chương) và lưu bản nháp thành công.`
                );
                onChanged?.();
                return true;
            } catch (err: any) {
                setError(err.message || 'Không thể tạo tệp E-Book.');
                return false;
            } finally {
                setIsUploading(false);
                setProgressStage('');
            }
        },
        [book, onChanged]
    );

    return {
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
        open,
        close,
        selectPresetType,
        selectFile,
        changeField,
        saveDraft,
        publish,
        generateAudio,
        generateFileFromChapters,
        // TTS audio preview
        previewSegments,
        previewPage,
        isLoadingSegments,
        playingAudioUrl,
        loadPreviewSegments,
        playAudio,
        stopAudio,
        // AI Copilot tester
        copilotQuestion,
        setCopilotQuestion,
        copilotResponse,
        isTestingCopilot,
        testCopilot,
    };
};

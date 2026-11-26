import { requestApi } from './apiClient';
import type {
    EbookEditionApiResponse,
    EbookEditionDetail,
    UploadEditionResponse,
    TtsGenerateResult,
    PageTtsSegment,
    CopilotTestResponse,
    EbookPresetEnum
} from '../types/ebookPublishing';

export const ebookPublishingService = {
    // 1. Kiểm tra đầu sách đã có ấn bản E-Book chưa
    async getEditionByBookId(bookId: number): Promise<EbookEditionApiResponse> {
        return requestApi<EbookEditionApiResponse>(`/EbookEditions/book/${bookId}`);
    },

    // 2. Tra cứu chi tiết ấn bản theo ID
    async getEditionById(editionId: number): Promise<EbookEditionDetail> {
        return requestApi<EbookEditionDetail>(`/EbookEditions/${editionId}`);
    },

    // 3. Tải lên tệp ấn bản điện tử mới (PDF hoặc EPUB)
    async uploadEdition(bookId: number, file: File): Promise<UploadEditionResponse> {
        const formData = new FormData();
        formData.append('BookId', bookId.toString());
        formData.append('File', file);

        return requestApi<UploadEditionResponse>('/EbookEditions/upload', {
            method: 'POST',
            body: formData,
        });
    },

    // 4. Lưu nháp cấu hình đọc (PresetType)
    async saveDraft(editionId: number, presetType: EbookPresetEnum): Promise<{ message: string; editionId: number; presetType: string }> {
        return requestApi<{ message: string; editionId: number; presetType: string }>(`/EbookEditions/${editionId}/draft`, {
            method: 'PUT',
            body: JSON.stringify({ presetType }),
        });
    },

    // 5. Kích hoạt xuất bản ấn bản (Bóc tách văn bản, nạp tri thức Vector RAG và mở bán sách)
    async publishEdition(editionId: number, presetType: EbookPresetEnum): Promise<{ message: string; editionId: number; presetType: string; status: string }> {
        return requestApi<{ message: string; editionId: number; presetType: string; status: string }>(`/EbookEditions/${editionId}/publish`, {
            method: 'POST',
            body: JSON.stringify({ presetType }),
        });
    },

    // 6. Sinh giọng đọc số AI TTS theo khoảng trang/chương
    async generateTts(
        editionId: number,
        options: { language?: string; fromPage?: number; toPage?: number } = {}
    ): Promise<TtsGenerateResult> {
        const params = new URLSearchParams();
        if (options.language) params.append('language', options.language);
        if (options.fromPage) params.append('fromPage', options.fromPage.toString());
        if (options.toPage) params.append('toPage', options.toPage.toString());

        const queryStr = params.toString() ? `?${params.toString()}` : '';
        return requestApi<TtsGenerateResult>(`/EbookEditions/${editionId}/tts/generate${queryStr}`, {
            method: 'POST',
        });
    },

    // 7. Lấy danh sách đoạn âm thanh TTS đã sinh của một trang để Staff nghe thử nghiệm thu
    async getPageSegments(editionId: number, pageNumber: number): Promise<PageTtsSegment[]> {
        return requestApi<PageTtsSegment[]>(`/EbookEditions/${editionId}/tts/pages/${pageNumber}/segments`, {
            method: 'GET',
        });
    },

    // 8. Staff test thử hỏi đáp AI Copilot dựa trên tri thức đã nạp của ấn bản
    async testCopilot(editionId: number, question: string, currentPage?: number): Promise<CopilotTestResponse> {
        return requestApi<CopilotTestResponse>(`/EbookEditions/${editionId}/ask-copilot`, {
            method: 'POST',
            body: JSON.stringify({ question, currentPage }),
        });
    },

    // 9. Gỡ bỏ/Xóa ấn bản E-Book khỏi sách
    async deleteEdition(editionId: number): Promise<{ success: boolean; message: string; bookId?: number }> {
        return requestApi<{ success: boolean; message: string; bookId?: number }>(`/EbookEditions/${editionId}`, {
            method: 'DELETE',
        });
    },

    // 10. Gỡ bỏ toàn bộ ấn bản E-Book của một đầu sách
    async deleteEditionsByBookId(bookId: number): Promise<{ success: boolean; message: string; bookId?: number }> {
        return requestApi<{ success: boolean; message: string; bookId?: number }>(`/EbookEditions/book/${bookId}`, {
            method: 'DELETE',
        });
    },

    async generateEditionFile(payload: {
        bookId: number;
        fileTitle: string;
        format: 'Epub' | 'Pdf';
        author?: string;
        chapters: { title: string; content: string }[];
    }): Promise<UploadEditionResponse> {
        return requestApi<UploadEditionResponse>('/EbookEditions/generate-file', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },
};

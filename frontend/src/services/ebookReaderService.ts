import { requestApi } from './apiClient';
import type { BookTtsSegmentDto, ReaderEditionDto } from '../types/reader';

export const ebookReaderService = {
    async getEditionByBookId(bookId: string): Promise<ReaderEditionDto> {
        const res = await requestApi<{ hasEdition: boolean; edition: any }>(`/EbookEditions/book/${bookId}`, {
            method: 'GET',
        });
        if (!res?.hasEdition || !res.edition) {
            throw new Error('Chưa có ấn bản E-Book khả dụng cho cuốn sách này.');
        }
        const ed = res.edition;
        const preset = Number(ed.presetType);
        return {
            editionId: ed.id,
            bookId: ed.bookId,
            title: ed.bookTitle,
            author: '',
            totalPages: ed.totalPages,
            // Giới hạn tính năng nghiêm ngặt theo nhóm phân loại ấn bản (Preset):
            // - Nhóm 1 (preset 1 - Văn học): TTS bật (nếu có audio), Copilot bật.
            // - Nhóm 2 (preset 2 - Học thuật): TTS TẮT HOÀN TOÀN, Copilot bật.
            // - Nhóm 3 (preset 3 - Thị giác): TTS TẮT HOÀN TOÀN, Copilot TẮT HOÀN TOÀN.
            ttsEnabled: preset === 1 && Boolean(ed.isTtsEnabled),
            chatEnabled: preset === 1 || preset === 2,
            presetType: preset,
        };
    },

    async getPageSegments(
        editionId: number,
        pageNumber: number
    ): Promise<BookTtsSegmentDto[]> {
        try {
            const data = await requestApi<any[]>(
                `/EbookEditions/${editionId}/tts/pages/${pageNumber}/segments`,
                { method: 'GET' }
            );
            if (!Array.isArray(data)) return [];
            return data.map((item, idx) => ({
                id: item.id || (pageNumber * 1000 + idx),
                editionId,
                pageNumber: item.pageNumber,
                segmentIndex: item.segmentIndex,
                textContent: item.textContent,
                audioUrlFemale: item.audioUrlFemale,
                audioUrlMale: item.audioUrlMale,
            }));
        } catch {
            return [];
        }
    },

    async askCopilot(
        editionId: number | string,
        question: string,
        currentPage: number,
        selectedText?: string
    ): Promise<string> {
        try {
            const data = await requestApi<{ answer?: string }>(
                `/EbookEditions/${editionId}/ask-copilot`,
                {
                    method: 'POST',
                    body: JSON.stringify({ question, currentPage, selectedText }),
                }
            );
            return data?.answer ?? `Đã phân tích ngữ cảnh trang ${currentPage}.`;
        } catch (err: any) {
            return err.message || `Tôi đã ghi nhận câu hỏi trên trang ${currentPage}: "${question}".`;
        }
    },
};

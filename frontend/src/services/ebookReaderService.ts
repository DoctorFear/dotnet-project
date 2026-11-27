import { requestApi } from './apiClient';
import type { BookTtsSegmentDto, ReaderEditionDto } from '../types/reader';

export interface ExtendedReaderEditionDto extends ReaderEditionDto {
    format: 'Pdf' | 'Epub';
    isSinglePage: boolean;
}

function normalizePreset(rawPreset: unknown, rawPresetName?: unknown): number {
    const name = String(rawPresetName ?? rawPreset ?? '').trim();
    if (name === 'EpubStandard' || Number(rawPreset) === 1) return 1;
    if (name === 'PdfStandard' || Number(rawPreset) === 2) return 2;
    if (name === 'ScannedBook' || Number(rawPreset) === 3) return 3;
    return 0;
}

export const ebookReaderService = {
    async getEditionByBookId(bookId: string): Promise<ExtendedReaderEditionDto> {
        const res = await requestApi<{ hasEdition: boolean; edition: any }>(`/EbookEditions/book/${bookId}`, {
            method: 'GET',
        });
        if (!res?.hasEdition || !res.edition) {
            throw new Error('Chưa có ấn bản E-Book khả dụng cho cuốn sách này.');
        }
        const ed = res.edition;
        const preset = normalizePreset(ed.presetType, ed.presetTypeName);
        const rawFormat = String(ed.format ?? '').toLowerCase();
        const isPdf = rawFormat === 'pdf' || preset === 2 || preset === 3;

        return {
            editionId: ed.id,
            bookId: ed.bookId,
            title: ed.bookTitle || ed.fileTitle,
            author: '',
            totalPages: Math.max(1, Number(ed.totalPages) || 1),
            ttsEnabled: preset !== 3 && Boolean(ed.isTtsEnabled),
            chatEnabled: preset === 1 || preset === 2,
            presetType: preset,
            format: isPdf ? 'Pdf' : 'Epub',
            isSinglePage: isPdf,
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
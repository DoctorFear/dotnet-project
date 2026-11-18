import { requestApi } from './apiClient';
import type { BookTtsSegmentDto, ReaderEditionDto } from '../types/reader';

export const ebookReaderService = {
    getEditionByBookId(bookId: string): Promise<ReaderEditionDto> {
        return requestApi<ReaderEditionDto>(`/ebooks/book/${bookId}/edition`, {
            method: 'GET',
        });
    },

    async getPageSegments(
        editionId: number,
        pageNumber: number
    ): Promise<BookTtsSegmentDto[]> {
        try {
            return await requestApi<BookTtsSegmentDto[]>(
                `/ebooks/${editionId}/pages/${pageNumber}/segments`,
                { method: 'GET' }
            );
        } catch {
            return [];
        }
    },

    async askCopilot(
        editionId: number | string,
        question: string,
        currentPage: number
    ): Promise<string> {
        try {
            const data = await requestApi<{ answer?: string }>(
                `/ebooks/${editionId}/copilot`,
                {
                    method: 'POST',
                    body: JSON.stringify({ question, currentPage }),
                }
            );
            return data?.answer ?? `Đã phân tích ngữ cảnh trang ${currentPage}.`;
        } catch {
            return `Tôi đã ghi nhận câu hỏi trên trang ${currentPage}: "${question}".`;
        }
    },
};
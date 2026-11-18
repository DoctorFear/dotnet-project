export interface BookTtsSegmentDto {
    id: number;
    editionId: number;
    pageNumber: number;
    segmentIndex: number;
    textContent: string;
    audioUrlFemale: string;
    audioUrlMale: string;
}

export interface ReaderEditionDto {
    editionId: number;
    bookId: number;
    title: string;
    author: string;
    totalPages: number;
    ttsEnabled: boolean;
    chatEnabled: boolean;
}
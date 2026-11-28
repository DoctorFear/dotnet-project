export interface BookTtsSegmentDto {
    id: number;
    segmentIndex: number;
    pageNumber: number;
    textContent: string;
    audioUrlFemale: string;
    audioUrlMale: string;
    audioUrlViFemale: string;
    audioUrlViMale: string;
    audioUrlEnFemale: string;
    audioUrlEnMale: string;
}

export interface ReaderEditionDto {
    editionId: number;
    bookId: number;
    title: string;
    author: string;
    totalPages: number;
    ttsEnabled: boolean;
    chatEnabled: boolean;
    presetType?: number;
}
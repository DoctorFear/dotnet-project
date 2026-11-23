export type EbookFormatType = 'Epub' | 'Pdf';

export type EbookPresetEnum = 1 | 2 | 3; // 1: EpubStandard (Văn học), 2: PdfStandard (Học thuật), 3: ScannedBook (Thị giác)

export type EditionPublishStatusType = 'Draft' | 'Processing' | 'Published' | 'Failed';

export interface EbookEditionDetail {
    id: number;
    bookId: number;
    bookTitle: string;
    fileTitle: string;
    format: EbookFormatType;
    dropboxPath: string;
    fileSizeBytes: number;
    totalPages: number;
    presetType: EbookPresetEnum;
    presetTypeName: string;
    status: number; // 0: Draft, 1: Processing, 2: Published, 3: Failed
    statusName: EditionPublishStatusType;
    publishedAt: string | null;
    isTtsEnabled: boolean;
    totalEmbeddings: number;
    createdAt: string;
    updatedAt: string | null;
}

export interface EbookEditionApiResponse {
    hasEdition: boolean;
    edition: EbookEditionDetail | null;
}

export interface UploadEditionResponse {
    editionId: number;
    bookId: number;
    fileTitle: string;
    format: string;
    totalPages: number;
    fileSizeBytes: number;
    status: string;
    suggestedPresetType: string;
}

export interface TtsGenerateResult {
    success: boolean;
    message: string;
    totalSegmentsGenerated: number;
}

export interface PageTtsSegment {
    segmentIndex: number;
    pageNumber: number;
    textContent: string;
    audioUrlFemale: string;
    audioUrlMale: string;
}

export interface CopilotTestResponse {
    question: string;
    answer: string;
    totalMatches: number;
    citations: {
        pageNumber: number;
        chunkIndex: number;
        chunkContent: string;
    }[];
}

export interface EbookPublishingDraftState {
    editionId: number | null;
    file: File | null;
    fileTitle: string;
    format: EbookFormatType | null;
    fileSizeBytes: number;
    totalPages: number;
    presetType: EbookPresetEnum;
    chatAiEnabled: boolean;
    ttsEnabled: boolean;
    ttsLanguage: string;
    ttsFromPage: string;
    ttsToPage: string;
    status: EditionPublishStatusType | null;
    publishedAt: string | null;
    totalEmbeddings: number;
    savedAt: string | null;
}

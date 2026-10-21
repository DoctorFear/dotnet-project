export type EbookDocumentType = 'epub' | 'pdf' | 'scan';

export interface EbookConfiguration {
    file: File | null;
    documentType: EbookDocumentType;
    chatEnabled: boolean;
    ttsEnabled: boolean;
    language: string;
    fromPage: string;
    toPage: string;
    savedAt: string | null;
}

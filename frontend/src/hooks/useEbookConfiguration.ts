import { useState } from 'react';
import type { AdminBookData } from '../types/book';
import type { EbookConfiguration, EbookDocumentType } from '../types/ebookConfiguration';

const emptyConfiguration = (): EbookConfiguration => ({
    file: null, documentType: 'epub', chatEnabled: true, ttsEnabled: true,
    language: 'vi', fromPage: '1', toPage: '', savedAt: null,
});

// Giữ bản nháp E-Book trong phiên giao diện, chưa gửi dữ liệu lên hệ thống.
export const useEbookConfiguration = () => {
    const [book, setBook] = useState<AdminBookData | null>(null);
    const [drafts, setDrafts] = useState<Record<number, EbookConfiguration>>({});
    const [draft, setDraft] = useState<EbookConfiguration>(emptyConfiguration);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    const open = (selectedBook: AdminBookData) => {
        setBook(selectedBook);
        setDraft({ ...(drafts[selectedBook.id] ?? emptyConfiguration()) });
        setError(''); setNotice(''); setIsDragging(false);
    };
    const close = () => setBook(null);
    const change = <K extends keyof EbookConfiguration>(key: K, value: EbookConfiguration[K]) => {
        setDraft(current => ({ ...current, [key]: value }));
        setError(''); setNotice('');
    };
    const selectDocumentType = (documentType: EbookDocumentType) => {
        setDraft(current => ({ ...current, documentType }));
        setError(''); setNotice('');
    };
    const selectFile = (files: FileList | null) => {
        setIsDragging(false); setNotice('');
        if (!files?.length) return;
        if (files.length > 1) { setError('Vui lòng chọn một file E-Book.'); return; }
        const file = files[0];
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (extension !== 'pdf' && extension !== 'epub') { setError('Chỉ hỗ trợ file PDF hoặc EPUB.'); return; }
        if (file.size === 0 || file.size > 100 * 1024 * 1024) { setError('File phải có nội dung và không vượt quá 100 MB.'); return; }
        setDraft(current => ({ ...current, file, documentType: extension, fromPage: '1', toPage: '' }));
        setError('');
    };
    const validate = () => {
        if (!draft.file) { setError('Vui lòng chọn file E-Book.'); return false; }
        const isEpub = draft.file.name.toLowerCase().endsWith('.epub');
        if (isEpub !== (draft.documentType === 'epub')) {
            setError('Loại tài liệu phải phù hợp với định dạng file đã chọn.'); return false;
        }
        if (draft.documentType !== 'scan' && draft.ttsEnabled &&
            (!Number.isInteger(Number(draft.fromPage)) || Number(draft.fromPage) < 1 ||
            draft.toPage !== '' && (!Number.isInteger(Number(draft.toPage)) || Number(draft.toPage) < Number(draft.fromPage)))) {
            setError('Khoảng trang/chương phải là số nguyên dương và trang kết thúc không nhỏ hơn trang bắt đầu.'); return false;
        }
        setError(''); return true;
    };
    const saveDraft = () => {
        if (!book || !validate()) return;
        const saved = { ...draft, savedAt: new Date().toISOString() };
        setDrafts(current => ({ ...current, [book.id]: saved }));
        setDraft(saved); setNotice('Đã lưu nháp trong phiên làm việc này.');
    };
    const publish = () => {
        if (validate()) setNotice('Chức năng xuất bản sẽ được bổ sung sau.');
    };
    const generateAudio = () => {
        if (validate()) setNotice('Chức năng tạo giọng đọc sẽ được bổ sung sau.');
    };
    return { book, draft, error, notice, isDragging, open, close, change, selectDocumentType,
        selectFile, setIsDragging, saveDraft, publish, generateAudio };
};

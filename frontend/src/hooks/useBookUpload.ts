import { useState } from 'react';
import { uploadBookImage, publishBookEdition, uploadBookEdition } from '../services/bookService';
import type { BookEditionUpload } from '../types/book';

export const useBookImageUpload = (onBusyChange?: (busy: boolean) => void) => {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const upload = async (files: FileList | null, onUploaded: (urls: string[]) => void) => {
        if (!files?.length || isUploading) return;
        setIsUploading(true); setError('');
        onBusyChange?.(true);
        try {
            const urls: string[] = [];
            for (const file of Array.from(files)) urls.push((await uploadBookImage(file)).fileUrl);
            onUploaded(urls);
        } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể tải ảnh.'); }
        finally { setIsUploading(false); onBusyChange?.(false); }
    };
    return { upload, isUploading, error };
};

export const useBookEditionUpload = (bookId: number, onBusyChange?: (busy: boolean) => void) => {
    const [edition, setEdition] = useState<BookEditionUpload | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const upload = async (file?: File) => {
        if (!file || isLoading) return;
        setIsLoading(true); setError('');
        onBusyChange?.(true);
        try { setEdition(await uploadBookEdition(bookId, file)); }
        catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể tải ấn bản.'); }
        finally { setIsLoading(false); onBusyChange?.(false); }
    };
    const publish = async () => {
        if (!edition || isLoading) return;
        setIsLoading(true); setError('');
        onBusyChange?.(true);
        try {
            await publishBookEdition(edition.editionId, edition.format.toLowerCase() === 'epub' ? 1 : 2);
            setEdition(current => current ? { ...current, status: 'Published' } : current);
        } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể xuất bản ấn bản.'); }
        finally { setIsLoading(false); onBusyChange?.(false); }
    };
    return { edition, isLoading, error, upload, publish };
};

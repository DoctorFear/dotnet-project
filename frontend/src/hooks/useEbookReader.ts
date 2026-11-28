import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ebookReaderService } from '../services/ebookReaderService';
import {
    FrontendTtsEngine,
    frontendTts,
    DEFAULT_TTS_VOICE_ID,
    DEFAULT_TTS_FALLBACK_ID,
    normalizeTtsVoiceId,
    normalizeTtsFallbackId,
    type TtsSentence,
    type TtsVoiceOption,
    type TtsPlayState,
    type TtsFallbackId,
} from '../services/frontendTtsService';
import { aiCopilotService, type AiSettings } from '../services/aiCopilotService';
import { parseEpub } from '../utils/epubParser';
import { extractPdf } from '../utils/pdfExtractor';
import { SAMPLE_BOOKS, type SampleBookData } from '../utils/sampleBooks';
import type { ReaderEditionDto } from '../types/reader';

export type ReadingMode = 'spread' | 'single' | 'scroll' | 'pdf-native';
export type ReaderTheme = 'light' | 'sepia' | 'cream' | 'dark';
export type FontFamily = 'serif' | 'sans' | 'mono';

export interface ReaderSegmentItem {
    segmentIndex: number;
    textContent: string;
    audioUrlFemale?: string;
    audioUrlMale?: string;
    audioUrlViFemale?: string;
    audioUrlViMale?: string;
    audioUrlEnFemale?: string;
    audioUrlEnMale?: string;
}

export interface ReaderPageItem {
    pageNumber: number;
    chapterTitle: string;
    paragraphs: string[];
    rawText: string;
    segments?: ReaderSegmentItem[];
}

export interface ReaderChatMessage {
    id: string;
    role: 'bot' | 'user';
    content: string;
    provider?: 'gemini' | 'local-llm' | 'offline-rules';
    modelName?: string;
    timestamp?: string;
}

const mapDtoToSegmentItem = (s: any): ReaderSegmentItem => ({
    segmentIndex: s.segmentIndex ?? s.SegmentIndex ?? 0,
    textContent: s.textContent ?? s.TextContent ?? '',
    audioUrlFemale: s.audioUrlFemale ?? s.AudioUrlFemale ?? '',
    audioUrlMale: s.audioUrlMale ?? s.AudioUrlMale ?? '',
    audioUrlViFemale: s.audioUrlViFemale ?? s.AudioUrlViFemale ?? s.audioUrlFemale ?? '',
    audioUrlViMale: s.audioUrlViMale ?? s.AudioUrlViMale ?? s.audioUrlMale ?? '',
    audioUrlEnFemale: s.audioUrlEnFemale ?? s.AudioUrlEnFemale ?? '',
    audioUrlEnMale: s.audioUrlEnMale ?? s.AudioUrlEnMale ?? '',
});

const mapSegmentToAudios = (s: ReaderSegmentItem) => ({
    audioUrlViFemale: s.audioUrlViFemale,
    audioUrlViMale: s.audioUrlViMale,
    audioUrlEnFemale: s.audioUrlEnFemale,
    audioUrlEnMale: s.audioUrlEnMale,
    audioUrlFemale: s.audioUrlFemale,
    audioUrlMale: s.audioUrlMale,
});

export const useEbookReader = (
    bookId: string | undefined,
    fallbackMeta?: { title?: string; author?: string }
) => {
    // 1. Dữ liệu sách & Trang
    const [edition, setEdition] = useState<ReaderEditionDto | null>(null);
    const [bookTitle, setBookTitle] = useState<string>(fallbackMeta?.title || 'Sách điện tử');
    const [author, setAuthor] = useState<string>(fallbackMeta?.author || '');
    const [pages, setPages] = useState<ReaderPageItem[]>([]);
    const [toc, setToc] = useState<{ title: string; pageIndex: number }[]>([]);
    const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

    // 2. Điều hướng & Chế độ xem
    const [leftPage, setLeftPage] = useState<number>(1);
    const [pageInput, setPageInput] = useState<string>('1');
    const [readingMode, setReadingMode] = useState<ReadingMode>('spread');
    const [theme, setTheme] = useState<ReaderTheme>('sepia');
    const [fontFamily, setFontFamily] = useState<FontFamily>('serif');
    const [fontSize, setFontSize] = useState<number>(16);
    const [lineHeight, setLineHeight] = useState<number>(1.8);
    const [scale, setScale] = useState<number>(1.0);
    const [navbarHidden, setNavbarHidden] = useState<boolean>(false);
    const [copilotOpen, setCopilotOpen] = useState<boolean>(true);
    const [tocOpen, setTocOpen] = useState<boolean>(false);
    const [aiSettingsOpen, setAiSettingsOpen] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState<string>('');
    const [loadingPages, setLoadingPages] = useState<boolean>(false);

    // 3. TTS State
    const [ttsState, setTtsState] = useState<TtsPlayState>('idle');
    const [activeSentence, setActiveSentence] = useState<TtsSentence | null>(null);
    const [availableVoices, setAvailableVoices] = useState<TtsVoiceOption[]>([]);
    const [selectedVoiceId, setSelectedVoiceId] = useState<string>(DEFAULT_TTS_VOICE_ID);
    const [fallbackVoiceId, setFallbackVoiceId] = useState<TtsFallbackId>(DEFAULT_TTS_FALLBACK_ID);
    const [speechRate, setSpeechRate] = useState<number>(1.0);
    const [speechPitch, setSpeechPitch] = useState<number>(1.0);

    const loadedPagesRef = useRef<Set<number>>(new Set());

    // 4. AI Copilot State
    const [aiSettings, setAiSettings] = useState<AiSettings>(aiCopilotService.getSettings());
    const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
    const [messages, setMessages] = useState<ReaderChatMessage[]>([
        {
            id: 'welcome',
            role: 'bot',
            content:
                'Xin chào! Tôi là Trợ lý AI đọc sách. Bấm vào bất kỳ câu nào để nghe đọc, hoặc bôi đen đoạn văn để hỏi đáp ngữ nghĩa.',
            provider: 'gemini',
        },
    ]);

    const showToast = useCallback((msg: string) => {
        setToastMessage(msg);
        window.setTimeout(() => setToastMessage((prev) => (prev === msg ? '' : prev)), 2800);
    }, []);

    const totalPages = useMemo(() => Math.max(1, pages.length), [pages.length]);
    const rightPage = useMemo(() => {
        if (readingMode !== 'spread') return null;
        return leftPage + 1 <= totalPages ? leftPage + 1 : null;
    }, [leftPage, readingMode, totalPages]);

    const currentLeftPageData = useMemo(() => {
        return pages.find((p) => p.pageNumber === leftPage) || null;
    }, [pages, leftPage]);

    const currentRightPageData = useMemo(() => {
        if (!rightPage) return null;
        return pages.find((p) => p.pageNumber === rightPage) || null;
    }, [pages, rightPage]);

    // Khởi tạo danh sách 4 giọng đọc Neural
    useEffect(() => {
        const list = frontendTts.getAvailableVoices();
        setAvailableVoices(list);
        frontendTts.setVoiceById(normalizeTtsVoiceId(selectedVoiceId));
        frontendTts.setFallbackVoiceId(normalizeTtsFallbackId(fallbackVoiceId));
    }, [selectedVoiceId, fallbackVoiceId]);

    const goToPage = useCallback(
        (target: number) => {
            const clamped = Math.max(1, Math.min(totalPages, target));
            const normalized = readingMode === 'spread' && clamped % 2 === 0 ? clamped - 1 : clamped;
            frontendTts.stop();
            setLeftPage(normalized);
            setPageInput(String(normalized));
        },
        [readingMode, totalPages]
    );

    useEffect(() => {
        frontendTts.onStateChange = (state) => setTtsState(state);
        frontendTts.onSentenceChange = (sentence) => setActiveSentence(sentence);
        frontendTts.onPageComplete = (finishedPage) => {
            if (readingMode === 'spread') {
                if (finishedPage + 2 <= totalPages) {
                    goToPage(finishedPage + 2);
                }
            } else {
                if (finishedPage + 1 <= totalPages) {
                    goToPage(finishedPage + 1);
                }
            }
        };

        return () => {
            frontendTts.stop();
        };
    }, [goToPage, readingMode, totalPages]);

    // Tải đầy đủ cả 4 URL âm thanh (vi/en, female/male) theo trang
    const loadSegmentsForPage = useCallback(
        async (editionId: number, pageNum: number) => {
            if (loadedPagesRef.current.has(pageNum)) return;
            try {
                const segs = await ebookReaderService.getPageSegments(editionId, pageNum);
                loadedPagesRef.current.add(pageNum);
                if (segs.length > 0) {
                    setPages((prev) =>
                        prev.map((item) => {
                            if (item.pageNumber === pageNum) {
                                return {
                                    ...item,
                                    paragraphs: segs.map((s) => s.textContent),
                                    rawText: segs.map((s) => s.textContent).join('\n\n'),
                                    segments: segs.map(mapDtoToSegmentItem),
                                };
                            }
                            return item;
                        })
                    );
                }
            } catch {
                // ignore
            }
        },
        []
    );

    useEffect(() => {
        if (!edition?.editionId) return;
        const edId = Number(edition.editionId);
        if (Number.isNaN(edId) || edId <= 0) return;

        void loadSegmentsForPage(edId, leftPage);
        if (rightPage) {
            void loadSegmentsForPage(edId, rightPage);
        }
    }, [edition?.editionId, leftPage, rightPage, loadSegmentsForPage]);

    useEffect(() => {
        let active = true;
        setLoadingPages(true);
        loadedPagesRef.current.clear();

        const loadSample = (sample: SampleBookData) => {
            setBookTitle(sample.title);
            setAuthor(sample.author);
            const convertedPages: ReaderPageItem[] = sample.pages.map((p) => ({
                pageNumber: p.pageNumber,
                chapterTitle: p.chapterTitle,
                paragraphs: p.paragraphs,
                rawText: p.paragraphs.join('\n\n'),
            }));
            setPages(convertedPages);
            setToc(sample.pages.map((p) => ({ title: p.chapterTitle, pageIndex: p.pageNumber })));
            setLoadingPages(false);
        };

        if (!bookId) {
            loadSample(SAMPLE_BOOKS[0]);
            return;
        }

        const foundSample = SAMPLE_BOOKS.find((b) => b.id === bookId);
        if (foundSample) {
            loadSample(foundSample);
            return;
        }

        ebookReaderService
            .getEditionByBookId(bookId)
            .then(async (data) => {
                if (!active) return;
                setEdition(data);
                setBookTitle(data.title || fallbackMeta?.title || `Sách #${bookId}`);
                setAuthor(data.author || fallbackMeta?.author || '');

                if (data.format === 'Pdf') {
                    try {
                        const token = localStorage.getItem('accessToken');
                        const res = await fetch(`/api/EbookEditions/${data.editionId}/file`, {
                            headers: token ? { Authorization: `Bearer ${token}` } : {},
                        });
                        if (res.ok) {
                            const blob = await res.blob();
                            const blobUrl = URL.createObjectURL(blob);
                            if (active) setPdfBlobUrl(blobUrl);
                        }
                    } catch (err) {
                        console.warn('[PDF Load Failure]', err);
                    }
                }

                try {
                    const page1 = await ebookReaderService.getPageSegments(data.editionId, 1);
                    const page2 =
                        data.totalPages > 1
                            ? await ebookReaderService.getPageSegments(data.editionId, 2)
                            : [];
                    loadedPagesRef.current.add(1);
                    if (data.totalPages > 1) loadedPagesRef.current.add(2);

                    const totalCount = Math.max(1, data.totalPages || 1);
                    const builtPages: ReaderPageItem[] = [];

                    for (let p = 1; p <= totalCount; p++) {
                        const segs = p === 1 ? page1 : p === 2 ? page2 : [];
                        builtPages.push({
                            pageNumber: p,
                            chapterTitle: `Trang ${p}`,
                            paragraphs:
                                segs.length > 0
                                    ? segs.map((s) => s.textContent)
                                    : [`Đang tải nội dung trang ${p}...`],
                            rawText: segs.map((s) => s.textContent).join('\n\n'),
                            segments: segs.map(mapDtoToSegmentItem),
                        });
                    }

                    setPages(builtPages);
                    setToc(
                        builtPages.slice(0, 15).map((p) => ({
                            title: `Trang ${p.pageNumber}`,
                            pageIndex: p.pageNumber,
                        }))
                    );
                    setLoadingPages(false);
                } catch {
                    loadSample(SAMPLE_BOOKS[0]);
                }
            })
            .catch(() => {
                if (active) {
                    loadSample(SAMPLE_BOOKS[0]);
                }
            });

        return () => {
            active = false;
        };
    }, [bookId, fallbackMeta?.author, fallbackMeta?.title]);

    const prevSpread = () => {
        if (readingMode === 'spread') {
            if (leftPage > 1) goToPage(leftPage - 2);
        } else {
            if (leftPage > 1) goToPage(leftPage - 1);
        }
    };

    const nextSpread = () => {
        if (readingMode === 'spread') {
            if (leftPage + 2 <= totalPages) goToPage(leftPage + 2);
        } else {
            if (leftPage + 1 <= totalPages) goToPage(leftPage + 1);
        }
    };

    // Phát toàn bộ trang hiện tại với đầy đủ 4 URL MP3 (vi/en, female/male)
    const playCurrentSpread = () => {
        const targetPages =
            readingMode === 'spread'
                ? ([currentLeftPageData, currentRightPageData].filter(Boolean) as ReaderPageItem[])
                : ([currentLeftPageData].filter(Boolean) as ReaderPageItem[]);

        if (targetPages.length === 0) {
            showToast('Không có nội dung văn bản để đọc.');
            return;
        }

        const allSentences: TtsSentence[] = [];
        targetPages.forEach((p) => {
            const segmentAudios = p.segments?.map(mapSegmentToAudios);
            const sList = FrontendTtsEngine.splitIntoSentences(
                p.paragraphs,
                p.pageNumber,
                segmentAudios
            );
            allSentences.push(...sList);
        });

        if (allSentences.length === 0) {
            showToast('Không tìm thấy câu văn nào để đọc.');
            return;
        }

        frontendTts.loadSentences(allSentences, 0);
        frontendTts.play();
    };

    const togglePlayPause = () => {
        if (ttsState === 'playing') {
            frontendTts.pause();
        } else if (ttsState === 'paused') {
            frontendTts.resume();
        } else {
            playCurrentSpread();
        }
    };

    const normalizeSpace = (s: string) => s.replace(/\s+/g, ' ').trim();

    const playSpecificParagraph = (text: string, pageNum: number) => {
        const targetPage = pages.find((p) => p.pageNumber === pageNum);
        const targetNorm = normalizeSpace(text);
        const matchingSegment =
            targetPage?.segments?.find((s) => normalizeSpace(s.textContent) === targetNorm) ??
            targetPage?.segments?.find((s) => normalizeSpace(s.textContent).includes(targetNorm));

        const segmentAudios = matchingSegment ? [mapSegmentToAudios(matchingSegment)] : undefined;

        const sentences = FrontendTtsEngine.splitIntoSentences([text], pageNum, segmentAudios);
        if (sentences.length > 0) {
            frontendTts.loadSentences(sentences, 0);
            frontendTts.play();
        }
    };
    const changeVoice = (voiceId: string) => {
        const normalized = normalizeTtsVoiceId(voiceId);
        setSelectedVoiceId(normalized);
        frontendTts.setVoiceById(normalized);
        const opt = availableVoices.find((v) => v.id === normalized);
        showToast(`Đã chọn giọng chính: ${opt?.name || normalized}`);
    };

    const changeFallbackVoice = (voiceId: string) => {
        const normalized = normalizeTtsFallbackId(voiceId);
        setFallbackVoiceId(normalized);
        frontendTts.setFallbackVoiceId(normalized);
        if (normalized === 'auto') {
            showToast('Giọng dự phòng: Tự động (Trình duyệt)');
        } else {
            const opt = availableVoices.find((v) => v.id === normalized);
            showToast(`Giọng dự phòng: ${opt?.name || normalized}`);
        }
    };

    const changeSpeechRate = (rate: number) => {
        setSpeechRate(rate);
        frontendTts.setRate(rate);
    };

    const changeSpeechPitch = (pitch: number) => {
        setSpeechPitch(pitch);
        frontendTts.setPitch(pitch);
    };

    const downloadPdf = async () => {
        showToast('Đang chuẩn bị tệp PDF tải về...');
        try {
            if (pdfBlobUrl) {
                const a = document.createElement('a');
                a.href = pdfBlobUrl;
                a.download = `${bookTitle || 'ancientbook-tai-lieu'}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                showToast(`Đã tải xuống tệp PDF: "${bookTitle}"`);
                return;
            }

            if (edition?.editionId) {
                const token = localStorage.getItem('accessToken');
                const res = await fetch(`/api/EbookEditions/${edition.editionId}/file`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                if (res.ok) {
                    const blob = await res.blob();
                    const blobUrl = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = blobUrl;
                    a.download = `${bookTitle || 'ancientbook-tai-lieu'}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
                    showToast(`Đã tải xuống tệp PDF: "${bookTitle}"`);
                    return;
                }
            }

            const bookHeader =
                `============================================================\n` +
                `TÁC PHẨM: ${bookTitle.toUpperCase()}\n` +
                `TÁC GIẢ: ${author || 'Khuyết danh'}\n` +
                `NỀN TẢNG: ancientBOOK — Thư viện Sách & Văn học Số hóa\n` +
                `NGÀY TẢI: ${new Date().toLocaleDateString('vi-VN')}\n` +
                `============================================================\n\n`;

            const bodyText = pages
                .map((p) => `--- [ ${p.chapterTitle} | Trang ${p.pageNumber} ] ---\n\n${p.paragraphs.join('\n\n')}`)
                .join('\n\n\n');

            const fullText = bookHeader + bodyText;
            const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${bookTitle.replace(/[\\/:*?"<>|]/g, '_')}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 5000);
            showToast(`Đã tải tài liệu tác phẩm: "${bookTitle}"`);
        } catch (err: any) {
            showToast(`Lỗi tải tệp: ${err?.message || 'Không thể tải tệp'}`);
        }
    };

    const loadUploadedFile = async (file: File) => {
        setLoadingPages(true);
        frontendTts.stop();
        const fileName = file.name.toLowerCase();

        try {
            const buffer = await file.arrayBuffer();

            if (fileName.endsWith('.epub')) {
                const epubData = await parseEpub(buffer);
                setBookTitle(epubData.title);
                setAuthor(epubData.author);
                const converted: ReaderPageItem[] = epubData.pages.map((p) => ({
                    pageNumber: p.pageNumber,
                    chapterTitle: p.chapterTitle,
                    paragraphs: p.paragraphs,
                    rawText: p.rawText,
                }));
                setPages(converted);
                setToc(epubData.toc.map((t) => ({ title: t.title, pageIndex: t.pageIndex })));
                setReadingMode('spread');
                goToPage(1);
                showToast(`Đã mở tệp EPUB: "${epubData.title}" (${converted.length} trang).`);
            } else if (fileName.endsWith('.pdf')) {
                const pdfData = await extractPdf(buffer, file.name);
                setBookTitle(pdfData.title);
                setAuthor('Tài liệu PDF');
                setPdfBlobUrl(pdfData.blobUrl);
                const converted: ReaderPageItem[] = pdfData.pages.map((p) => ({
                    pageNumber: p.pageNumber,
                    chapterTitle: `Trang PDF ${p.pageNumber}`,
                    paragraphs: p.paragraphs,
                    rawText: p.rawText,
                }));
                setPages(converted);
                setToc(pdfData.pages.map((p) => ({ title: `Trang ${p.pageNumber}`, pageIndex: p.pageNumber })));
                setReadingMode('spread');
                goToPage(1);
                showToast(`Đã nạp PDF: "${pdfData.title}" (${converted.length} trang).`);
            }
        } catch (err: any) {
            showToast(`Lỗi phân tích tệp: ${err?.message || 'Tệp hỏng hoặc không đúng định dạng.'}`);
        } finally {
            setLoadingPages(false);
        }
    };

    const switchSampleBook = (sampleId: string) => {
        const found = SAMPLE_BOOKS.find((b) => b.id === sampleId);
        if (found) {
            frontendTts.stop();
            setPdfBlobUrl(null);
            setEdition(null);
            setBookTitle(found.title);
            setAuthor(found.author);
            const converted: ReaderPageItem[] = found.pages.map((p) => ({
                pageNumber: p.pageNumber,
                chapterTitle: p.chapterTitle,
                paragraphs: p.paragraphs,
                rawText: p.paragraphs.join('\n\n'),
            }));
            setPages(converted);
            setToc(found.pages.map((p) => ({ title: p.chapterTitle, pageIndex: p.pageNumber })));
            goToPage(1);
            showToast(`Đã tải tác phẩm: "${found.title}".`);
        }
    };

    const askCopilot = async (question: string, selectedText?: string) => {
        if (!question.trim()) return;
        const displayUserMsg = selectedText ? `${question}\n> "${selectedText}"` : question;
        const userMsgId = `${Date.now()}-u`;
        setMessages((prev) => [...prev, { id: userMsgId, role: 'user', content: displayUserMsg }]);
        if (!copilotOpen) setCopilotOpen(true);
        setIsAiLoading(true);

        const currentText = currentLeftPageData?.rawText || '';
        try {
            const res = await aiCopilotService.askAi(question, {
                editionId: edition?.editionId,
                bookTitle,
                author,
                currentPage: leftPage,
                selectedText,
                pageContent: currentText,
            });

            setMessages((prev) => [
                ...prev,
                {
                    id: `${Date.now()}-b`,
                    role: 'bot',
                    content: res.answer,
                    provider: res.provider,
                    modelName: res.modelName,
                },
            ]);
        } catch (err: any) {
            setMessages((prev) => [
                ...prev,
                {
                    id: `${Date.now()}-b`,
                    role: 'bot',
                    content: `⚠️ Lỗi xử lý: ${err?.message || 'Không thể nhận phản hồi.'}`,
                    provider: 'offline-rules',
                },
            ]);
        } finally {
            setIsAiLoading(false);
        }
    };

    const updateAiSettings = (updated: Partial<AiSettings>) => {
        const neu = aiCopilotService.saveSettings(updated);
        setAiSettings(neu);
        showToast('Đã lưu cấu hình AI.');
    };

    return {
        // Book Meta
        edition,
        bookTitle,
        author,
        pages,
        toc,
        pdfBlobUrl,
        loadingPages,
        totalPages,

        // Navigation & Display
        leftPage,
        rightPage,
        pageInput,
        setPageInput,
        goToPage,
        prevSpread,
        nextSpread,
        currentLeftPageData,
        currentRightPageData,

        // Customization
        readingMode,
        setReadingMode,
        theme,
        setTheme,
        fontFamily,
        setFontFamily,
        fontSize,
        setFontSize,
        lineHeight,
        setLineHeight,
        scale,
        zoomIn: () => setScale((s) => Math.min(1.4, +(s + 0.1).toFixed(2))),
        zoomOut: () => setScale((s) => Math.max(0.7, +(s - 0.1).toFixed(2))),
        navbarHidden,
        toggleNavbar: () => setNavbarHidden((h) => !h),
        copilotOpen,
        toggleCopilot: () => setCopilotOpen((o) => !o),
        tocOpen,
        toggleToc: () => setTocOpen((o) => !o),
        aiSettingsOpen,
        setAiSettingsOpen,
        toastMessage,

        // TTS Engine
        ttsState,
        activeSentence,
        availableVoices,
        selectedVoiceId,
        fallbackVoiceId,
        speechRate,
        speechPitch,
        togglePlayPause,
        playCurrentSpread,
        playSpecificParagraph,
        changeVoice,
        changeFallbackVoice,
        changeSpeechRate,
        changeSpeechPitch,
        nextSentence: () => frontendTts.next(),
        prevSentence: () => frontendTts.prev(),
        stopTts: () => frontendTts.stop(),

        // File & Download & Sample Books
        downloadPdf,
        loadUploadedFile,
        switchSampleBook,

        // Ask AI
        messages,
        askCopilot,
        isAiLoading,
        aiSettings,
        updateAiSettings,
        clearChat: () => setMessages([]),
    };
};
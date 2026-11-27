import { useCallback, useEffect, useMemo, useState } from 'react';
import { ebookReaderService } from '../services/ebookReaderService';
import { frontendTts, type TtsSentence, type TtsVoiceOption, type TtsPlayState } from '../services/frontendTtsService';
import { aiCopilotService, type AiSettings } from '../services/aiCopilotService';
import { parseEpub } from '../utils/epubParser';
import { extractPdf } from '../utils/pdfExtractor';
import { SAMPLE_BOOKS, type SampleBookData } from '../utils/sampleBooks';
import type { ReaderEditionDto } from '../types/reader';

export type ReadingMode = 'spread' | 'single' | 'scroll' | 'pdf-native';
export type ReaderTheme = 'light' | 'sepia' | 'cream' | 'dark';
export type FontFamily = 'serif' | 'sans' | 'mono';

export interface ReaderPageItem {
    pageNumber: number;
    chapterTitle: string;
    paragraphs: string[];
    rawText: string;
}

export interface ReaderChatMessage {
    id: string;
    role: 'bot' | 'user';
    content: string;
    provider?: 'gemini' | 'local-llm' | 'offline-rules';
    modelName?: string;
    timestamp?: string;
}

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
    const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');
    const [speechRate, setSpeechRate] = useState<number>(1.0);
    const [speechPitch, setSpeechPitch] = useState<number>(1.0);

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

    // Lấy nội dung trang hiện tại
    const currentLeftPageData = useMemo(() => {
        return pages.find((p) => p.pageNumber === leftPage) || null;
    }, [pages, leftPage]);

    const currentRightPageData = useMemo(() => {
        if (!rightPage) return null;
        return pages.find((p) => p.pageNumber === rightPage) || null;
    }, [pages, rightPage]);

    // Khởi tạo giọng đọc TTS từ Web Speech API
    useEffect(() => {
        const updateVoices = () => {
            const list = frontendTts.getAvailableVoices();
            setAvailableVoices(list);
            const defaultVi = list.find((v) => v.isVietnamese) || list[0];
            if (defaultVi && !selectedVoiceId) {
                setSelectedVoiceId(defaultVi.id);
            }
        };

        updateVoices();
        const timer = setTimeout(updateVoices, 300);
        return () => clearTimeout(timer);
    }, [selectedVoiceId]);

    // Đồng bộ sự kiện TTS engine
    useEffect(() => {
        frontendTts.onStateChange = (state) => setTtsState(state);
        frontendTts.onSentenceChange = (sentence) => setActiveSentence(sentence);
        frontendTts.onPageComplete = (finishedPage) => {
            // Tự động lật trang kế tiếp khi đọc xong trang hiện tại
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
    }, [readingMode, totalPages]);

    // Nạp sách mặc định hoặc sách từ backend
    useEffect(() => {
        let active = true;
        setLoadingPages(true);

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

        // Thử tìm trong danh sách sách mẫu trước
        const foundSample = SAMPLE_BOOKS.find((b) => b.id === bookId);
        if (foundSample) {
            loadSample(foundSample);
            return;
        }

        // Gọi Backend tra cứu ấn bản E-Book
        ebookReaderService
            .getEditionByBookId(bookId)
            .then(async (data) => {
                if (!active) return;
                setEdition(data);
                setBookTitle(data.title || fallbackMeta?.title || `Sách #${bookId}`);
                setAuthor(data.author || fallbackMeta?.author || '');

                // Tải các đoạn text segments từ backend
                try {
                    const page1 = await ebookReaderService.getPageSegments(data.editionId, 1);
                    const page2 = await ebookReaderService.getPageSegments(data.editionId, 2);

                    if (page1.length > 0 || page2.length > 0) {
                        const builtPages: ReaderPageItem[] = [];
                        for (let p = 1; p <= Math.min(data.totalPages || 10, 50); p++) {
                            const segs = p === 1 ? page1 : p === 2 ? page2 : [];
                            builtPages.push({
                                pageNumber: p,
                                chapterTitle: `Trang ${p}`,
                                paragraphs: segs.length > 0 ? segs.map((s) => s.textContent) : [`Nội dung trang ${p}`],
                                rawText: segs.map((s) => s.textContent).join('\n\n'),
                            });
                        }
                        setPages(builtPages);
                        setToc([{ title: 'Nội dung sách', pageIndex: 1 }]);
                        setLoadingPages(false);
                        return;
                    }
                } catch {
                    // ignore
                }

                // Nếu backend chưa có segments, nạp sách mẫu để trải nghiệm đầy đủ
                loadSample(SAMPLE_BOOKS[0]);
            })
            .catch((err: any) => {
                if (active) {
                    loadSample(SAMPLE_BOOKS[0]);
                }
                console.log(err);
            });

        return () => {
            active = false;
        };
    }, [bookId, fallbackMeta?.author, fallbackMeta?.title, showToast]);

    // Chuyển trang an toàn
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

    // Điều khiển giọng đọc TTS
    const playCurrentSpread = () => {
        const targetPages = readingMode === 'spread'
            ? [currentLeftPageData, currentRightPageData].filter(Boolean) as ReaderPageItem[]
            : [currentLeftPageData].filter(Boolean) as ReaderPageItem[];

        if (targetPages.length === 0) {
            showToast('Không có nội dung văn bản để đọc.');
            return;
        }

        const allSentences: TtsSentence[] = [];
        targetPages.forEach((p) => {
            const sList = frontendTts.constructor.prototype.constructor.splitIntoSentences(
                p.paragraphs,
                p.pageNumber
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

    const playSpecificParagraph = (text: string, pageNum: number) => {
        const sentences = frontendTts.constructor.prototype.constructor.splitIntoSentences([text], pageNum);
        if (sentences.length > 0) {
            frontendTts.loadSentences(sentences, 0);
            frontendTts.play();
        }
    };

    const changeVoice = (voiceId: string) => {
        setSelectedVoiceId(voiceId);
        frontendTts.setVoiceById(voiceId);
        showToast('Đã đổi giọng đọc AI.');
    };

    const changeSpeechRate = (rate: number) => {
        setSpeechRate(rate);
        frontendTts.setRate(rate);
    };

    const changeSpeechPitch = (pitch: number) => {
        setSpeechPitch(pitch);
        frontendTts.setPitch(pitch);
    };

    // Mở tệp sách từ máy tính (.epub, .pdf, .txt)
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
                showToast(`Đã mở thành công tệp EPUB: "${epubData.title}" (${converted.length} trang).`);
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
                showToast(`Đã phân tích PDF: "${pdfData.title}" (${converted.length} trang).`);
            } else if (fileName.endsWith('.txt')) {
                const text = new TextDecoder('utf-8').decode(buffer);
                const paras = text.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p.length > 0);
                const txtPages: ReaderPageItem[] = [];
                let pNum = 1;
                let batch: string[] = [];
                let len = 0;
                for (const para of paras) {
                    batch.push(para);
                    len += para.length;
                    if (len >= 800) {
                        txtPages.push({
                            pageNumber: pNum++,
                            chapterTitle: `Phần ${pNum - 1}`,
                            paragraphs: [...batch],
                            rawText: batch.join('\n\n'),
                        });
                        batch = [];
                        len = 0;
                    }
                }
                if (batch.length > 0) {
                    txtPages.push({
                        pageNumber: pNum++,
                        chapterTitle: `Phần ${pNum - 1}`,
                        paragraphs: [...batch],
                        rawText: batch.join('\n\n'),
                    });
                }
                setBookTitle(file.name.replace(/\.txt$/, ''));
                setAuthor('Tài liệu Text');
                setPages(txtPages);
                setToc([{ title: 'Mở đầu', pageIndex: 1 }]);
                goToPage(1);
                showToast(`Đã nạp tệp Text (${txtPages.length} trang).`);
            } else {
                showToast('Chỉ hỗ trợ tệp định dạng .EPUB, .PDF hoặc .TXT.');
            }
        } catch (err: any) {
            console.error('[Open File Error]', err);
            showToast(`Lỗi phân tích tệp: ${err?.message || 'Tệp hỏng hoặc không đúng định dạng.'}`);
        } finally {
            setLoadingPages(false);
        }
    };

    // Đổi sách mẫu
    const switchSampleBook = (sampleId: string) => {
        const found = SAMPLE_BOOKS.find((b) => b.id === sampleId);
        if (found) {
            frontendTts.stop();
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

    // Gửi câu hỏi đến Copilot (Tự động Gemini -> Local LLM fallback)
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
        speechRate,
        speechPitch,
        togglePlayPause,
        playCurrentSpread,
        playSpecificParagraph,
        changeVoice,
        changeSpeechRate,
        changeSpeechPitch,
        nextSentence: () => frontendTts.next(),
        prevSentence: () => frontendTts.prev(),
        stopTts: () => frontendTts.stop(),

        // File & Sample Books
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

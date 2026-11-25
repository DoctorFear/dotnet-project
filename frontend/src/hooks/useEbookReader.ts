import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ebookReaderService } from '../services/ebookReaderService';
import type { BookTtsSegmentDto, ReaderEditionDto } from '../types/reader';

// ============================================================================
// BIẾN SỐ TÙY CHỈNH NỐI FILE ÂM THANH (ĐƠN VỊ: GIÂY)
// - Khởi điểm: 0 (Chạy liền kề tuần tự bình thường, hết file này phát tiếp file sau)
// - Khi cần tùy chỉnh: Bạn có thể tăng dần từ 0 lên 0.1, 0.2 ... 1.0 (hoặc số bất kỳ)
// - Càng tăng giá trị này thì file sau sẽ càng được nối sớm vào file trước bấy nhiêu giây
// ============================================================================
export const AUDIO_OVERLAP_SECONDS = 0.86;

export interface ReaderChatMessage {
    id: string;
    role: 'bot' | 'user';
    content: string;
}

export const useEbookReader = (
    bookId: string | undefined,
    fallbackMeta?: { title?: string; author?: string }
) => {
    const [edition, setEdition] = useState<ReaderEditionDto | null>(null);
    const [leftPage, setLeftPage] = useState<number>(1);
    const [pageInput, setPageInput] = useState<string>('1');
    const [leftSegments, setLeftSegments] = useState<BookTtsSegmentDto[]>([]);
    const [rightSegments, setRightSegments] = useState<BookTtsSegmentDto[]>([]);
    const [loadingPages, setLoadingPages] = useState<boolean>(false);

    const [scale, setScale] = useState<number>(1.0);
    const [navbarHidden, setNavbarHidden] = useState<boolean>(false);
    const [copilotOpen, setCopilotOpen] = useState<boolean>(true);
    const [toastMessage, setToastMessage] = useState<string>('');

    // TTS state
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [activeSegmentId, setActiveSegmentId] = useState<number | null>(null);
    const [speechRate, setSpeechRate] = useState<number>(1.0);
    const [voiceGender, setVoiceGender] = useState<'female' | 'male'>('female');
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioCache = useRef<Map<string, HTMLAudioElement>>(new Map());
    const monitorIntervalRef = useRef<number | null>(null);

    const clearMonitor = () => {
        if (monitorIntervalRef.current !== null) {
            window.clearInterval(monitorIntervalRef.current);
            monitorIntervalRef.current = null;
        }
    };

    // Chuyển URL Dropbox sang CDN direct dl.dropboxusercontent.com để bỏ qua chuyển hướng 302, tải nhanh gấp 4 lần
    const toDirectAudioUrl = (url: string | null | undefined): string | null => {
        if (!url) return null;
        return url
            .replace('www.dropbox.com', 'dl.dropboxusercontent.com')
            .replace('dropbox.com', 'dl.dropboxusercontent.com');
    };

    const preloadAudio = useCallback((rawUrl: string | null | undefined) => {
        const url = toDirectAudioUrl(rawUrl);
        if (!url || audioCache.current.has(url)) return;
        try {
            const audio = new Audio();
            audio.preload = 'auto';
            audio.src = url;
            audio.load();
            audioCache.current.set(url, audio);
        } catch {
            // ignore preload error
        }
    }, []);

    // Copilot state
    const [messages, setMessages] = useState<ReaderChatMessage[]>([
        {
            id: 'welcome',
            role: 'bot',
            content:
                'Xin chào! Bấm trực tiếp vào bất kỳ đoạn văn nào trên trang để nghe giọng đọc AI, hoặc bôi đen câu văn để hỏi Copilot.',
        },
    ]);

    const totalPages = edition?.totalPages ?? 184;
    const rightPage = leftPage + 1 <= totalPages ? leftPage + 1 : null;

    const spreadSegments = useMemo(
        () => [...leftSegments, ...rightSegments],
        [leftSegments, rightSegments]
    );

    // Tự động nạp trước (preload) âm thanh các đoạn trong trang hiện tại vào bộ đệm trình duyệt
    useEffect(() => {
        spreadSegments.forEach((seg) => {
            const url = voiceGender === 'female' ? seg.audioUrlFemale : seg.audioUrlMale;
            if (url) preloadAudio(url);
        });
    }, [spreadSegments, voiceGender, preloadAudio]);

    const showToast = useCallback((msg: string) => {
        setToastMessage(msg);
        window.setTimeout(() => setToastMessage((prev) => (prev === msg ? '' : prev)), 2500);
    }, []);

    useEffect(() => {
        if (!bookId) return;
        let active = true;
        ebookReaderService
            .getEditionByBookId(bookId)
            .then((data) => {
                if (active) {
                    setEdition(data);
                    if (!data.chatEnabled) {
                        setCopilotOpen(false);
                    }
                }
            })
            .catch(() => {
                if (active) {
                    setEdition({
                        editionId: Number(bookId),
                        bookId: Number(bookId),
                        title: fallbackMeta?.title ?? `Sách điện tử #${bookId}`,
                        author: fallbackMeta?.author ?? '',
                        totalPages: 184,
                        ttsEnabled: false,
                        chatEnabled: false,
                    });
                    setCopilotOpen(false);
                }
            });
        return () => {
            active = false;
        };
    }, [bookId, fallbackMeta?.author, fallbackMeta?.title]);

    useEffect(() => {
        if (!edition) return;
        let active = true;
        setLoadingPages(true);

        Promise.all([
            ebookReaderService.getPageSegments(edition.editionId, leftPage),
            rightPage
                ? ebookReaderService.getPageSegments(edition.editionId, rightPage)
                : Promise.resolve([]),
        ]).then(([leftData, rightData]) => {
            if (active) {
                setLeftSegments(leftData);
                setRightSegments(rightData);
                setLoadingPages(false);
            }
        });

        return () => {
            active = false;
        };
    }, [edition, leftPage, rightPage]);

    const stopAudio = useCallback(() => {
        clearMonitor();
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.onended = null;
            audioRef.current.ontimeupdate = null;
            audioRef.current = null;
        }
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        setIsPlaying(false);
        setActiveSegmentId(null);
    }, []);

    useEffect(() => stopAudio, [stopAudio]);

    const playSegment = useCallback(
        (segment: BookTtsSegmentDto) => {
            if (!edition?.ttsEnabled) {
                showToast('Tính năng giọng đọc số không áp dụng cho phân loại ấn bản này.');
                return;
            }
            stopAudio();
            setActiveSegmentId(segment.id);
            setIsPlaying(true);

            const idx = spreadSegments.findIndex((s) => s.id === segment.id);

            // Preload trước 3 đoạn kế tiếp ngay khi đoạn này phát để sẵn sàng nối tiếp
            if (idx !== -1) {
                for (let offset = 1; offset <= 3; offset++) {
                    const nextSeg = spreadSegments[idx + offset];
                    if (nextSeg) {
                        const nextRaw = voiceGender === 'female' ? nextSeg.audioUrlFemale : nextSeg.audioUrlMale;
                        if (nextRaw) preloadAudio(nextRaw);
                    }
                }
            }

            let hasAdvanced = false;
            const handleAdvance = () => {
                if (hasAdvanced) return;
                hasAdvanced = true;
                clearMonitor();

                if (idx !== -1 && idx + 1 < spreadSegments.length) {
                    playSegment(spreadSegments[idx + 1]);
                } else {
                    stopAudio();
                }
            };

            const rawAudioUrl = voiceGender === 'female' ? segment.audioUrlFemale : segment.audioUrlMale;
            const audioUrl = toDirectAudioUrl(rawAudioUrl);

            if (audioUrl) {
                // Ưu tiên dùng audio đã được buffer sẵn trong cache
                let audio = audioCache.current.get(audioUrl);
                if (!audio) {
                    audio = new Audio(audioUrl);
                    audio.preload = 'auto';
                    audioCache.current.set(audioUrl, audio);
                }

                audio.currentTime = 0;
                audio.playbackRate = speechRate;

                // Nếu bạn tùy chỉnh AUDIO_OVERLAP_SECONDS > 0: Cho phép kích hoạt file sau sớm hơn X giây
                if (AUDIO_OVERLAP_SECONDS > 0) {
                    monitorIntervalRef.current = window.setInterval(() => {
                        if (!audio || audio.paused || hasAdvanced) return;
                        if (audio.duration && audio.duration > AUDIO_OVERLAP_SECONDS) {
                            const timeLeft = audio.duration - audio.currentTime;
                            if (timeLeft <= AUDIO_OVERLAP_SECONDS) {
                                handleAdvance();
                            }
                        }
                    }, 20);
                }

                // Chạy liền kề tuần tự bình thường khi hết file (mặc định khi AUDIO_OVERLAP_SECONDS = 0)
                audio.onended = handleAdvance;
                audio.onerror = () => {
                    clearMonitor();
                    // Fallback sang Web Speech API nếu tệp Dropbox gặp sự cố
                    if ('speechSynthesis' in window) {
                        const utter = new SpeechSynthesisUtterance(segment.textContent);
                        utter.lang = 'vi-VN';
                        utter.rate = speechRate;
                        utter.pitch = voiceGender === 'female' ? 1.15 : 0.85;
                        utter.onend = handleAdvance;
                        utter.onerror = stopAudio;
                        window.speechSynthesis.speak(utter);
                    } else {
                        showToast('Lỗi phát tệp âm thanh từ máy chủ.');
                        stopAudio();
                    }
                };
                audioRef.current = audio;
                void audio.play().catch(() => {
                    // Xử lý chặn autoplay trình duyệt
                    stopAudio();
                });
            } else if ('speechSynthesis' in window) {
                const utter = new SpeechSynthesisUtterance(segment.textContent);
                utter.lang = 'vi-VN';
                utter.rate = speechRate;
                utter.pitch = voiceGender === 'female' ? 1.15 : 0.85;
                utter.onend = handleAdvance;
                utter.onerror = stopAudio;
                window.speechSynthesis.speak(utter);
            } else {
                stopAudio();
            }
        },
        [edition?.ttsEnabled, preloadAudio, showToast, speechRate, spreadSegments, stopAudio, voiceGender]
    );

    const changeSpeechRate = (rate: number) => {
        setSpeechRate(rate);
        if (audioRef.current) audioRef.current.playbackRate = rate;
    };

    const changeVoiceGender = (gender: 'female' | 'male') => {
        setVoiceGender(gender);
        showToast(`Đã chuyển sang ${gender === 'female' ? 'Giọng Nữ AI' : 'Giọng Nam AI'}`);
        if (isPlaying && activeSegmentId !== null) {
            const currentSeg = spreadSegments.find((s) => s.id === activeSegmentId);
            if (currentSeg) window.setTimeout(() => playSegment(currentSeg), 0);
        }
    };

    const togglePlayPause = () => {
        if (!edition?.ttsEnabled) {
            showToast('Tính năng giọng đọc số không áp dụng cho phân loại ấn bản này.');
            return;
        }
        if (isPlaying) {
            stopAudio();
            return;
        }
        const target = spreadSegments.find((s) => s.id === activeSegmentId) ?? spreadSegments[0];
        if (target) playSegment(target);
        else showToast('Trang này chưa có dữ liệu âm thanh để đọc.');
    };

    const goToPage = (target: number) => {
        const clamped = Math.max(1, Math.min(totalPages, target));
        const normalizedLeft = clamped % 2 === 1 ? clamped : clamped - 1;
        stopAudio();
        setLeftPage(normalizedLeft);
        setPageInput(String(normalizedLeft));
    };

    const askCopilot = async (question: string, selectedText?: string) => {
        if (!question.trim()) return;
        const displayMsg = selectedText
            ? `${question}\n"${selectedText}"`
            : question;
        setMessages((prev) => [...prev, { id: `${Date.now()}-u`, role: 'user', content: displayMsg }]);
        if (!copilotOpen) setCopilotOpen(true);

        const answer = await ebookReaderService.askCopilot(
            edition?.editionId ?? bookId ?? 0,
            question,
            leftPage,
            selectedText
        );
        setMessages((prev) => [...prev, { id: `${Date.now()}-b`, role: 'bot', content: answer }]);
    };
    return {
        edition,
        leftPage,
        rightPage,
        totalPages,
        pageInput,
        setPageInput,
        leftSegments,
        rightSegments,
        loadingPages,
        scale,
        zoomIn: () => setScale((s) => Math.min(1.35, +(s + 0.1).toFixed(2))),
        zoomOut: () => setScale((s) => Math.max(0.75, +(s - 0.1).toFixed(2))),
        navbarHidden,
        toggleNavbar: () => setNavbarHidden((h) => !h),
        copilotOpen,
        toggleCopilot: () => {
            if (!edition?.chatEnabled) {
                showToast('Tính năng Trợ lý AI không áp dụng cho phân loại ấn bản Thị giác.');
                return;
            }
            setCopilotOpen((o) => !o);
        },
        toastMessage,
        isPlaying,
        activeSegmentId,
        speechRate,
        voiceGender,
        playSegment,
        togglePlayPause,
        changeSpeechRate,
        changeVoiceGender,
        goToPage,
        prevSpread: () => leftPage > 1 && goToPage(leftPage - 2),
        nextSpread: () => leftPage + 2 <= totalPages && goToPage(leftPage + 2),
        messages,
        askCopilot,
    };
};
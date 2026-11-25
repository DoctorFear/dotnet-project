import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ebookReaderService } from '../services/ebookReaderService';
import type { BookTtsSegmentDto, ReaderEditionDto } from '../types/reader';

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

    const showToast = useCallback((msg: string) => {
        setToastMessage(msg);
        window.setTimeout(() => setToastMessage((prev) => (prev === msg ? '' : prev)), 2500);
    }, []);

    useEffect(() => {
        if (!bookId) return;
        let active = true;
        ebookReaderService
            .getEditionByBookId(bookId)
            .then((data) => active && setEdition(data))
            .catch(() => {
                if (active) {
                    setEdition({
                        editionId: Number(bookId),
                        bookId: Number(bookId),
                        title: fallbackMeta?.title ?? `Sách điện tử #${bookId}`,
                        author: fallbackMeta?.author ?? '',
                        totalPages: 184,
                        ttsEnabled: true,
                        chatEnabled: true,
                    });
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
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.onended = null;
            audioRef.current = null;
        }
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        setIsPlaying(false);
        setActiveSegmentId(null);
    }, []);

    useEffect(() => stopAudio, [stopAudio]);

    const playSegment = useCallback(
        (segment: BookTtsSegmentDto) => {
            stopAudio();
            setActiveSegmentId(segment.id);
            setIsPlaying(true);

            const handleAdvance = () => {
                const idx = spreadSegments.findIndex((s) => s.id === segment.id);
                if (idx !== -1 && idx + 1 < spreadSegments.length) {
                    playSegment(spreadSegments[idx + 1]);
                } else {
                    stopAudio();
                }
            };

            const audioUrl = voiceGender === 'female' ? segment.audioUrlFemale : segment.audioUrlMale;
            if (audioUrl) {
                const audio = new Audio(audioUrl);
                audio.playbackRate = speechRate;
                audio.onended = handleAdvance;
                audio.onerror = () => {
                    showToast('Lỗi phát tệp âm thanh từ máy chủ.');
                    stopAudio();
                };
                audioRef.current = audio;
                void audio.play();
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
        [showToast, speechRate, spreadSegments, stopAudio, voiceGender]
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
        if (isPlaying) {
            stopAudio();
            return;
        }
        const target = spreadSegments.find((s) => s.id === activeSegmentId) ?? spreadSegments[0];
        if (target) playSegment(target);
        else showToast('Trang này chưa có dữ liệu văn bản để đọc.');
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
        toggleCopilot: () => setCopilotOpen((o) => !o),
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
// ============================================================================
// HỆ THỐNG GIỌNG ĐỌC AI FRONTEND (CLIENT-SIDE TTS ENGINE)
// Hỗ trợ đồng thời:
// 1. Giọng đọc tạo sẵn (Pre-generated Neural Audio MP3: Nữ Hoài My, Nam Nam Minh)
// 2. Trình tổng hợp giọng nói Web Speech API (fallback khi chưa tạo sẵn audio)
// Karaoke highlight thời gian thực, điều chỉnh tốc độ (0.75x - 2.0x), chuyển câu & lật trang tự động.
// ============================================================================

export interface TtsVoiceOption {
    id: string;
    name: string;
    lang: string;
    isVietnamese: boolean;
    isDefault?: boolean;
    isPreset?: boolean;
    gender?: 'female' | 'male';
    voice?: SpeechSynthesisVoice;
}

export interface TtsSentence {
    id: number;
    text: string;
    pageNumber: number;
    paragraphIndex: number;
    audioUrlFemale?: string;
    audioUrlMale?: string;
}

export type TtsPlayState = 'idle' | 'playing' | 'paused';

class FrontendTtsEngine {
    private synth: SpeechSynthesis | null = null;
    private currentUtterance: SpeechSynthesisUtterance | null = null;
    private voices: SpeechSynthesisVoice[] = [];
    private selectedVoiceId: string = 'preset-female';
    private selectedBrowserVoice: SpeechSynthesisVoice | null = null;
    private rate: number = 1.0;
    private pitch: number = 1.0;
    private volume: number = 1.0;

    // Audio HTML5 cho giọng đọc tạo sẵn (Dropbox CDN / MP3)
    private audioElement: HTMLAudioElement | null = null;

    private sentences: TtsSentence[] = [];
    private currentIndex: number = -1;
    private playState: TtsPlayState = 'idle';

    // Event listeners
    public onStateChange?: (state: TtsPlayState) => void;
    public onSentenceChange?: (sentence: TtsSentence | null, index: number) => void;
    public onFinishedAll?: () => void;
    public onPageComplete?: (pageNumber: number) => void;

    constructor() {
        if (typeof window !== 'undefined') {
            if ('speechSynthesis' in window) {
                this.synth = window.speechSynthesis;
                this.initVoices();
                if (this.synth.onvoiceschanged !== undefined) {
                    this.synth.onvoiceschanged = () => this.initVoices();
                }
            }

            // Khởi tạo Audio Element
            this.audioElement = new Audio();
            this.audioElement.preload = 'auto';

            this.audioElement.onended = () => {
                if (this.playState !== 'playing') return;
                this.handleSentenceFinished();
            };

            this.audioElement.onerror = (e) => {
                console.warn('[Audio Playback Error, falling back to Web Speech]', e);
                // Nếu tệp âm thanh bị lỗi hoặc CORS, chuyển sang Web Speech để tiếp tục đọc
                this.playWithWebSpeech();
            };
        }
    }

    public isSupported(): boolean {
        return typeof window !== 'undefined';
    }

    private initVoices() {
        if (!this.synth) return;
        this.voices = this.synth.getVoices();
    }

    /**
     * Danh sách giọng đọc kết hợp:
     * - 2 Giọng đọc tạo sẵn chất lượng cao Neural (Nữ Hoài My & Nam Nam Minh)
     * - Các giọng đọc tổng hợp của hệ thống / trình duyệt
     */
    public getAvailableVoices(): TtsVoiceOption[] {
        const presets: TtsVoiceOption[] = [
            {
                id: 'preset-female',
                name: 'Nữ AI (Hoài My - Neural) [Tiếng Việt]',
                lang: 'vi-VN',
                isVietnamese: true,
                isPreset: true,
                gender: 'female',
                isDefault: true,
            },
            {
                id: 'preset-male',
                name: 'Nam AI (Nam Minh - Neural) [Tiếng Việt]',
                lang: 'vi-VN',
                isVietnamese: true,
                isPreset: true,
                gender: 'male',
            },
        ];

        let browserOptions: TtsVoiceOption[] = [];
        if (this.synth) {
            const rawList = this.synth.getVoices();
            if (rawList.length > 0) this.voices = rawList;

            browserOptions = this.voices.map((v, i) => {
                const isVi = v.lang.toLowerCase().startsWith('vi') || v.name.toLowerCase().includes('vietnam');
                return {
                    id: `sys-${v.lang}-${v.name}-${i}`,
                    name: `${v.name} (${v.lang})${isVi ? ' [Tiếng Việt]' : ''}`,
                    lang: v.lang,
                    isVietnamese: isVi,
                    isDefault: false,
                    isPreset: false,
                    voice: v,
                };
            });
        }

        return [...presets, ...browserOptions];
    }

    public getSelectedVoiceId(): string {
        return this.selectedVoiceId;
    }

    public setVoiceById(voiceId: string) {
        this.selectedVoiceId = voiceId;
        const all = this.getAvailableVoices();
        const found = all.find((v) => v.id === voiceId);

        if (found) {
            if (found.voice) {
                this.selectedBrowserVoice = found.voice;
            } else {
                this.selectedBrowserVoice = null;
            }
        }

        if (this.playState === 'playing') {
            this.playCurrent();
        }
    }

    public setRate(newRate: number) {
        this.rate = Math.max(0.5, Math.min(2.5, newRate));
        if (this.audioElement) {
            this.audioElement.playbackRate = this.rate;
        }
        if (this.currentUtterance && this.synth?.speaking) {
            this.playCurrent();
        }
    }

    public setPitch(newPitch: number) {
        this.pitch = Math.max(0.5, Math.min(1.5, newPitch));
    }

    public setVolume(newVol: number) {
        this.volume = Math.max(0, Math.min(1, newVol));
        if (this.audioElement) {
            this.audioElement.volume = this.volume;
        }
    }

    public getState(): TtsPlayState {
        return this.playState;
    }

    public getCurrentIndex(): number {
        return this.currentIndex;
    }

    /**
     * Nạp danh sách các đoạn câu để đọc tuần tự
     */
    public loadSentences(sentences: TtsSentence[], startIndex: number = 0) {
        this.stop();
        this.sentences = sentences;
        this.currentIndex = Math.max(0, Math.min(sentences.length - 1, startIndex));
    }

    /**
     * Tách văn bản thành danh sách câu đọc (hỗ trợ kèm audioUrls từ segments)
     */
    public static splitIntoSentences(
        paragraphs: string[],
        pageNumber: number = 1,
        segmentAudios?: { female?: string; male?: string }[]
    ): TtsSentence[] {
        const result: TtsSentence[] = [];
        let counter = 1;

        paragraphs.forEach((para, pIdx) => {
            if (!para.trim()) return;
            const aud = segmentAudios && segmentAudios[pIdx] ? segmentAudios[pIdx] : undefined;

            // Tách theo dấu câu tiếng Việt hoặc xuống dòng
            const rawSentences = para
                .split(/(?<=[.?!…\n])\s+/)
                .map((s) => s.trim())
                .filter((s) => s.length > 0);

            if (rawSentences.length === 0) {
                result.push({
                    id: counter++,
                    text: para.trim(),
                    pageNumber,
                    paragraphIndex: pIdx,
                    audioUrlFemale: aud?.female,
                    audioUrlMale: aud?.male,
                });
            } else {
                for (const raw of rawSentences) {
                    result.push({
                        id: counter++,
                        text: raw,
                        pageNumber,
                        paragraphIndex: pIdx,
                        audioUrlFemale: aud?.female,
                        audioUrlMale: aud?.male,
                    });
                }
            }
        });

        return result;
    }

    public play() {
        if (this.playState === 'paused') {
            if (this.audioElement && this.audioElement.src && this.audioElement.paused) {
                this.audioElement.play().catch(() => {});
                this.playState = 'playing';
                this.onStateChange?.(this.playState);
                return;
            }
            if (this.synth && this.synth.paused) {
                this.synth.resume();
                this.playState = 'playing';
                this.onStateChange?.(this.playState);
                return;
            }
        }

        if (this.sentences.length === 0) return;
        if (this.currentIndex < 0 || this.currentIndex >= this.sentences.length) {
            this.currentIndex = 0;
        }

        this.playCurrent();
    }

    public pause() {
        let didPause = false;
        if (this.audioElement && !this.audioElement.paused) {
            this.audioElement.pause();
            didPause = true;
        }
        if (this.synth && this.synth.speaking && !this.synth.paused) {
            this.synth.pause();
            didPause = true;
        }

        if (didPause) {
            this.playState = 'paused';
            this.onStateChange?.(this.playState);
        }
    }

    public resume() {
        if (this.playState === 'paused') {
            this.play();
        } else {
            this.play();
        }
    }

    public stop() {
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.currentTime = 0;
            this.audioElement.removeAttribute('src');
        }
        if (this.synth) {
            this.synth.cancel();
            this.currentUtterance = null;
        }
        this.playState = 'idle';
        this.onStateChange?.(this.playState);
        this.onSentenceChange?.(null, -1);
    }

    public next() {
        if (this.currentIndex + 1 < this.sentences.length) {
            this.currentIndex++;
            this.playCurrent();
        } else {
            this.stop();
            this.onFinishedAll?.();
        }
    }

    public prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.playCurrent();
        }
    }

    public playSentenceAtIndex(idx: number) {
        if (idx >= 0 && idx < this.sentences.length) {
            this.currentIndex = idx;
            this.playCurrent();
        }
    }

    private playCurrent() {
        if (this.sentences.length === 0) return;
        if (this.currentIndex < 0 || this.currentIndex >= this.sentences.length) {
            this.stop();
            this.onFinishedAll?.();
            return;
        }

        // Hủy phát hiện tại
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.removeAttribute('src');
        }
        if (this.synth) {
            this.synth.cancel();
        }

        const sentence = this.sentences[this.currentIndex];
        this.onSentenceChange?.(sentence, this.currentIndex);

        // 1. Kiểm tra xem có tệp âm thanh tạo sẵn (Neural MP3) phù hợp không
        const isPresetFemale = this.selectedVoiceId === 'preset-female';
        const isPresetMale = this.selectedVoiceId === 'preset-male';

        let targetAudioUrl: string | undefined;
        if (isPresetFemale && sentence.audioUrlFemale) {
            targetAudioUrl = sentence.audioUrlFemale;
        } else if (isPresetMale && sentence.audioUrlMale) {
            targetAudioUrl = sentence.audioUrlMale;
        }

        if (targetAudioUrl && this.audioElement) {
            try {
                this.audioElement.src = targetAudioUrl;
                this.audioElement.playbackRate = this.rate;
                this.audioElement.volume = this.volume;
                this.audioElement
                    .play()
                    .then(() => {
                        this.playState = 'playing';
                        this.onStateChange?.(this.playState);
                    })
                    .catch((err) => {
                        console.warn('[Pre-generated Audio Playback blocked/failed, falling back to Web Speech]', err);
                        this.playWithWebSpeech();
                    });
                return;
            } catch (err) {
                console.warn('[Pre-generated Audio exception, falling back to Web Speech]', err);
            }
        }

        // 2. Fallback: Phát bằng Web Speech API
        this.playWithWebSpeech();
    }

    private playWithWebSpeech() {
        if (!this.synth || this.sentences.length === 0) return;
        if (this.currentIndex < 0 || this.currentIndex >= this.sentences.length) return;

        const sentence = this.sentences[this.currentIndex];
        const utter = new SpeechSynthesisUtterance(sentence.text);

        // Xác định giọng đọc phù hợp
        if (this.selectedBrowserVoice) {
            utter.voice = this.selectedBrowserVoice;
            utter.lang = this.selectedBrowserVoice.lang;
        } else {
            // Tìm giọng tiếng Việt trong hệ thống
            const viVoice = this.voices.find(
                (v) => v.lang.toLowerCase().startsWith('vi') || v.name.toLowerCase().includes('vietnam')
            );
            if (viVoice) {
                utter.voice = viVoice;
                utter.lang = viVoice.lang;
            } else {
                utter.lang = 'vi-VN';
            }
        }

        // Tùy chỉnh pitch theo giới tính preset
        let effectivePitch = this.pitch;
        if (this.selectedVoiceId === 'preset-female') {
            effectivePitch = Math.min(1.4, this.pitch * 1.15);
        } else if (this.selectedVoiceId === 'preset-male') {
            effectivePitch = Math.max(0.6, this.pitch * 0.85);
        }

        utter.rate = this.rate;
        utter.pitch = effectivePitch;
        utter.volume = this.volume;

        utter.onend = () => {
            if (this.playState !== 'playing') return;
            this.handleSentenceFinished();
        };

        utter.onerror = (e) => {
            if (e.error === 'interrupted' || e.error === 'canceled') return;
            console.warn('[Frontend TTS Web Speech Error]', e);
            this.stop();
        };

        this.currentUtterance = utter;
        this.playState = 'playing';
        this.onStateChange?.(this.playState);

        try {
            this.synth.speak(utter);
        } catch (err) {
            console.error('[Frontend TTS Speak Failure]', err);
            this.stop();
        }
    }

    private handleSentenceFinished() {
        if (this.currentIndex < 0 || this.currentIndex >= this.sentences.length) return;
        const sentence = this.sentences[this.currentIndex];
        const nextIdx = this.currentIndex + 1;

        if (nextIdx < this.sentences.length) {
            const nextSentence = this.sentences[nextIdx];
            if (nextSentence.pageNumber !== sentence.pageNumber) {
                // Tự động chuyển trang khi hết trang
                this.onPageComplete?.(sentence.pageNumber);
            }
            this.currentIndex = nextIdx;
            this.playCurrent();
        } else {
            this.stop();
            this.onFinishedAll?.();
        }
    }
}

export const frontendTts = new FrontendTtsEngine();

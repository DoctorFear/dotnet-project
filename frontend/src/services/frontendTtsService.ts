// ============================================================================
// HỆ THỐNG GIỌNG ĐỌC AI FRONTEND (CLIENT-SIDE TTS ENGINE)
// Sử dụng Web Speech API chuẩn trình duyệt, hỗ trợ tách câu thông minh,
// karaoke highlight thời gian thực, điều chỉnh tốc độ, cao độ và tự động chuyển trang.
// ============================================================================

export interface TtsVoiceOption {
    id: string;
    name: string;
    lang: string;
    isVietnamese: boolean;
    isDefault: boolean;
    voice: SpeechSynthesisVoice;
}

export interface TtsSentence {
    id: number;
    text: string;
    pageNumber: number;
    paragraphIndex: number;
}

export type TtsPlayState = 'idle' | 'playing' | 'paused';

class FrontendTtsEngine {
    private synth: SpeechSynthesis | null = null;
    private currentUtterance: SpeechSynthesisUtterance | null = null;
    private voices: SpeechSynthesisVoice[] = [];
    private selectedVoice: SpeechSynthesisVoice | null = null;
    private rate: number = 1.0;
    private pitch: number = 1.0;
    private volume: number = 1.0;

    private sentences: TtsSentence[] = [];
    private currentIndex: number = -1;
    private playState: TtsPlayState = 'idle';

    // Event listeners
    public onStateChange?: (state: TtsPlayState) => void;
    public onSentenceChange?: (sentence: TtsSentence | null, index: number) => void;
    public onFinishedAll?: () => void;
    public onPageComplete?: (pageNumber: number) => void;

    constructor() {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            this.synth = window.speechSynthesis;
            this.initVoices();
            if (this.synth.onvoiceschanged !== undefined) {
                this.synth.onvoiceschanged = () => this.initVoices();
            }
        }
    }

    public isSupported(): boolean {
        return this.synth !== null;
    }

    private initVoices() {
        if (!this.synth) return;
        this.voices = this.synth.getVoices();
        // Tìm giọng tiếng Việt đầu tiên nếu có
        const viVoice = this.voices.find(
            (v) => v.lang.toLowerCase().startsWith('vi') || v.name.toLowerCase().includes('vietnam')
        );
        if (viVoice && !this.selectedVoice) {
            this.selectedVoice = viVoice;
        } else if (!this.selectedVoice && this.voices.length > 0) {
            this.selectedVoice = this.voices[0];
        }
    }

    public getAvailableVoices(): TtsVoiceOption[] {
        if (!this.synth) return [];
        const rawList = this.synth.getVoices();
        if (rawList.length > 0) this.voices = rawList;

        return this.voices.map((v, i) => {
            const isVi = v.lang.toLowerCase().startsWith('vi') || v.name.toLowerCase().includes('vietnam');
            return {
                id: `${v.lang}-${v.name}-${i}`,
                name: `${v.name} (${v.lang})${isVi ? ' 🇻🇳' : ''}`,
                lang: v.lang,
                isVietnamese: isVi,
                isDefault: v.default,
                voice: v,
            };
        });
    }

    public setVoice(voice: SpeechSynthesisVoice) {
        this.selectedVoice = voice;
        if (this.playState === 'playing') {
            this.playCurrent();
        }
    }

    public setVoiceById(voiceId: string) {
        const found = this.getAvailableVoices().find((v) => v.id === voiceId);
        if (found) this.setVoice(found.voice);
    }

    public setRate(newRate: number) {
        this.rate = Math.max(0.5, Math.min(2.5, newRate));
        if (this.currentUtterance && this.synth?.speaking) {
            // Thay đổi tức thì cho câu hiện tại
            this.playCurrent();
        }
    }

    public setPitch(newPitch: number) {
        this.pitch = Math.max(0.5, Math.min(1.5, newPitch));
    }

    public setVolume(newVol: number) {
        this.volume = Math.max(0, Math.min(1, newVol));
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
     * Tách văn bản thành danh sách câu đọc
     */
    public static splitIntoSentences(
        paragraphs: string[],
        pageNumber: number = 1
    ): TtsSentence[] {
        const result: TtsSentence[] = [];
        let counter = 1;

        paragraphs.forEach((para, pIdx) => {
            if (!para.trim()) return;
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
                });
            } else {
                for (const raw of rawSentences) {
                    result.push({
                        id: counter++,
                        text: raw,
                        pageNumber,
                        paragraphIndex: pIdx,
                    });
                }
            }
        });

        return result;
    }

    public play() {
        if (!this.synth) return;
        if (this.playState === 'paused') {
            this.synth.resume();
            this.playState = 'playing';
            this.onStateChange?.(this.playState);
            return;
        }

        if (this.sentences.length === 0) return;
        if (this.currentIndex < 0 || this.currentIndex >= this.sentences.length) {
            this.currentIndex = 0;
        }

        this.playCurrent();
    }

    public pause() {
        if (!this.synth) return;
        if (this.synth.speaking && !this.synth.paused) {
            this.synth.pause();
            this.playState = 'paused';
            this.onStateChange?.(this.playState);
        }
    }

    public resume() {
        if (!this.synth) return;
        if (this.synth.paused) {
            this.synth.resume();
            this.playState = 'playing';
            this.onStateChange?.(this.playState);
        } else {
            this.play();
        }
    }

    public stop() {
        if (!this.synth) return;
        this.synth.cancel();
        this.currentUtterance = null;
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
        if (!this.synth || this.sentences.length === 0) return;
        if (this.currentIndex < 0 || this.currentIndex >= this.sentences.length) {
            this.stop();
            this.onFinishedAll?.();
            return;
        }

        this.synth.cancel();
        const sentence = this.sentences[this.currentIndex];
        this.onSentenceChange?.(sentence, this.currentIndex);

        const utter = new SpeechSynthesisUtterance(sentence.text);
        if (this.selectedVoice) {
            utter.voice = this.selectedVoice;
            utter.lang = this.selectedVoice.lang;
        } else {
            utter.lang = 'vi-VN';
        }

        utter.rate = this.rate;
        utter.pitch = this.pitch;
        utter.volume = this.volume;

        utter.onend = () => {
            if (this.playState !== 'playing') return;

            // Kiểm tra xem câu vừa đọc có phải câu cuối của trang hay không
            const nextIdx = this.currentIndex + 1;
            if (nextIdx < this.sentences.length) {
                const nextSentence = this.sentences[nextIdx];
                if (nextSentence.pageNumber !== sentence.pageNumber) {
                    // Chuyển trang!
                    this.onPageComplete?.(sentence.pageNumber);
                }
                this.currentIndex = nextIdx;
                this.playCurrent();
            } else {
                this.stop();
                this.onFinishedAll?.();
            }
        };

        utter.onerror = (e) => {
            // Lỗi hủy chủ động do stop() hoặc next() thì bỏ qua
            if (e.error === 'interrupted' || e.error === 'canceled') return;
            console.warn('[Frontend TTS Error]', e);
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
}

export const frontendTts = new FrontendTtsEngine();

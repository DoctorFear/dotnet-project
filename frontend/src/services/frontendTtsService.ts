// ============================================================================
// HỆ THỐNG GIỌNG ĐỌC AI FRONTEND (CLIENT-SIDE TTS ENGINE)
// Ưu tiên: File MP3 trên Dropbox -> Live TTS Server -> Browser Web Speech
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

export type TtsPresetId = 'vi-female' | 'vi-male' | 'en-female' | 'en-male';
export type TtsFallbackId = TtsPresetId | 'auto';

export const DEFAULT_TTS_VOICE_ID: TtsPresetId = 'vi-female';
export const DEFAULT_TTS_FALLBACK_ID: TtsFallbackId = 'auto';

export const TTS_VOICE_PRESETS: readonly (TtsVoiceOption & { id: TtsPresetId; gender: 'female' | 'male' })[] = [
    { id: 'vi-female', name: 'Nữ - Tiếng Việt (Hoài My)', lang: 'vi-VN', isVietnamese: true, isPreset: true, gender: 'female', isDefault: true },
    { id: 'vi-male', name: 'Nam - Tiếng Việt (Nam Minh)', lang: 'vi-VN', isVietnamese: true, isPreset: true, gender: 'male' },
    { id: 'en-female', name: 'Nữ - Tiếng Anh (Ava HD)', lang: 'en-US', isVietnamese: false, isPreset: true, gender: 'female' },
    { id: 'en-male', name: 'Nam - Tiếng Anh (Andrew HD)', lang: 'en-US', isVietnamese: false, isPreset: true, gender: 'male' },
];

const TTS_PROXY_SYNTHESIZE_URL =
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_TTS_PROXY_URL) ||
    'http://127.0.0.1:5050/synthesize';

export function normalizeTtsVoiceId(id: string): TtsPresetId {
    if (id === 'preset-female') return 'vi-female';
    if (id === 'preset-male') return 'vi-male';
    return TTS_VOICE_PRESETS.find(v => v.id === id)?.id ?? DEFAULT_TTS_VOICE_ID;
}

export function normalizeTtsFallbackId(id: string): TtsFallbackId {
    if (id === 'auto') return 'auto';
    if (id === 'preset-female') return 'vi-female';
    if (id === 'preset-male') return 'vi-male';
    return TTS_VOICE_PRESETS.find(v => v.id === id)?.id ?? DEFAULT_TTS_FALLBACK_ID;
}

export interface TtsAudioUrls {
    audioUrlViFemale?: string;
    audioUrlViMale?: string;
    audioUrlEnFemale?: string;
    audioUrlEnMale?: string;
    audioUrlFemale?: string;
    audioUrlMale?: string;
}

export interface TtsSegmentAudios extends TtsAudioUrls {
    viFemale?: string;
    viMale?: string;
    enFemale?: string;
    enMale?: string;
    female?: string;
    male?: string;
}

export interface TtsSentence extends TtsAudioUrls {
    id: number;
    text: string;
    pageNumber: number;
    paragraphIndex: number;
}

export type TtsPlayState = 'idle' | 'playing' | 'paused';

export class FrontendTtsEngine {
    private synth: SpeechSynthesis | null = null;
    private currentUtterance: SpeechSynthesisUtterance | null = null;
    private voices: SpeechSynthesisVoice[] = [];
    private selectedVoiceId: TtsPresetId = DEFAULT_TTS_VOICE_ID;
    private fallbackVoiceId: TtsFallbackId = DEFAULT_TTS_FALLBACK_ID;
    private playbackVersion = 0;
    private rate: number = 1.0;
    private pitch: number = 1.0;
    private volume: number = 1.0;

    private audioElement: HTMLAudioElement | null = null;
    private blobUrlCache = new Map<string, string>();
    private activeAbortController: AbortController | null = null;

    private sentences: TtsSentence[] = [];
    private currentIndex: number = -1;
    private playState: TtsPlayState = 'idle';

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
        return typeof window !== 'undefined';
    }

    private initVoices() {
        if (!this.synth) return;
        this.voices = this.synth.getVoices();
    }

    public getAvailableVoices(): TtsVoiceOption[] {
        return TTS_VOICE_PRESETS.map(v => ({ ...v }));
    }

    public getSelectedVoiceId(): string {
        return this.selectedVoiceId;
    }

    public setVoiceById(voiceId: string) {
        const nextVoice = normalizeTtsVoiceId(voiceId);
        if (this.selectedVoiceId === nextVoice) return;
        this.selectedVoiceId = nextVoice;

        if (this.playState === 'playing') {
            this.playCurrent();
        } else if (this.playState === 'paused') {
            this.clearPlayback();
            this.playState = 'idle';
            this.onStateChange?.(this.playState);
        }
    }

    public getFallbackVoiceId(): TtsFallbackId {
        return this.fallbackVoiceId;
    }

    public setFallbackVoiceId(voiceId: string) {
        const nextFallback = normalizeTtsFallbackId(voiceId);
        if (this.fallbackVoiceId === nextFallback) return;
        this.fallbackVoiceId = nextFallback;
        if (this.playState === 'playing') {
            this.playCurrent();
        }
    }

    public setRate(newRate: number) {
        this.rate = Math.max(0.5, Math.min(2.5, newRate));
        if (this.audioElement) {
            this.audioElement.playbackRate = this.rate;
        }
        if (this.playState === 'playing' && this.currentUtterance && this.synth?.speaking) {
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

    public loadSentences(sentences: TtsSentence[], startIndex: number = 0) {
        this.stop();
        this.sentences = sentences;
        this.currentIndex = Math.max(0, Math.min(sentences.length - 1, startIndex));
    }

    public static splitIntoSentences(
        paragraphs: string[],
        pageNumber: number = 1,
        segmentAudios?: TtsSegmentAudios[]
    ): TtsSentence[] {
        const result: TtsSentence[] = [];
        let counter = 1;

        paragraphs.forEach((para, pIdx) => {
            const text = para.trim();
            if (!text) return;
            const aud = segmentAudios?.[pIdx];
            const urls: TtsAudioUrls = {
                audioUrlViFemale: aud?.audioUrlViFemale || aud?.viFemale || aud?.audioUrlFemale || aud?.female,
                audioUrlViMale: aud?.audioUrlViMale || aud?.viMale || aud?.audioUrlMale || aud?.male,
                audioUrlEnFemale: aud?.audioUrlEnFemale || aud?.enFemale,
                audioUrlEnMale: aud?.audioUrlEnMale || aud?.enMale,
                audioUrlFemale: aud?.audioUrlFemale || aud?.female,
                audioUrlMale: aud?.audioUrlMale || aud?.male,
            };

            const hasAudio = [
                urls.audioUrlViFemale,
                urls.audioUrlViMale,
                urls.audioUrlEnFemale,
                urls.audioUrlEnMale,
                urls.audioUrlFemale,
                urls.audioUrlMale,
            ].some(Boolean);

            const parts = hasAudio
                ? [text]
                : text.split(/(?<=[.?!…\n])\s+/).map(s => s.trim()).filter(Boolean);

            for (const part of parts) {
                result.push({ id: counter++, text: part, pageNumber, paragraphIndex: pIdx, ...urls });
            }
        });
        return result;
    }

    public play() {
        if (this.playState === 'paused') {
            if (this.audioElement && this.audioElement.src && this.audioElement.paused) {
                const version = this.playbackVersion;
                this.playState = 'playing';
                this.onStateChange?.(this.playState);
                void this.audioElement.play().catch(() => {
                    if (version !== this.playbackVersion || this.playState !== 'playing') return;
                    this.playCurrent();
                });
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
        this.play();
    }

    private clearPlayback() {
        this.playbackVersion++;
        if (this.activeAbortController) {
            this.activeAbortController.abort();
            this.activeAbortController = null;
        }
        if (this.audioElement) {
            this.audioElement.onended = null;
            this.audioElement.onerror = null;
            this.audioElement.pause();
            this.audioElement = null;
        }
        this.currentUtterance = null;
        this.synth?.cancel();
    }

    public stop() {
        this.clearPlayback();
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

    private startAudioElement(srcUrl: string, version: number, onFailure: (err: unknown) => void) {
        if (version !== this.playbackVersion) return;

        const audio = new Audio();
        audio.preload = 'auto';
        this.audioElement = audio;

        audio.onended = () => {
            if (version === this.playbackVersion && this.playState === 'playing') {
                this.handleSentenceFinished();
            }
        };
        audio.onerror = (err) => {
            if (version !== this.playbackVersion || this.playState !== 'playing') return;
            onFailure(err);
        };

        this.playState = 'playing';
        this.onStateChange?.(this.playState);

        try {
            audio.src = srcUrl;
            audio.playbackRate = this.rate;
            audio.volume = this.volume;
            void audio.play().catch((err) => {
                if (version !== this.playbackVersion || this.playState !== 'playing') return;
                onFailure(err);
            });
        } catch (err) {
            onFailure(err);
        }
    }

    private playRemoteOrBlobUrl(url: string, version: number, onAllFailed: (err: unknown) => void) {
        const cachedBlob = this.blobUrlCache.get(url);
        if (cachedBlob) {
            this.startAudioElement(cachedBlob, version, onAllFailed);
            return;
        }

        // 1. Try direct <audio src="https://dl.dropboxusercontent.com/...">
        this.startAudioElement(url, version, async (directErr) => {
            if (version !== this.playbackVersion || this.playState !== 'playing') return;
            console.warn('[TTS] Direct MP3 stream failed, retrying via Blob fetch:', url, directErr);

            // 2. Retry via fetch() -> Blob URL (bypasses strict content-type/streaming issues)
            try {
                const controller = new AbortController();
                this.activeAbortController = controller;
                const res = await fetch(url, { signal: controller.signal });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const blob = await res.blob();
                if (version !== this.playbackVersion) return;

                const objectUrl = URL.createObjectURL(blob);
                this.blobUrlCache.set(url, objectUrl);
                this.startAudioElement(objectUrl, version, onAllFailed);
            } catch (fetchErr) {
                if (version !== this.playbackVersion || (fetchErr as any)?.name === 'AbortError') return;
                onAllFailed(fetchErr);
            }
        });
    }

    private async synthesizeLiveProxy(text: string, presetId: TtsPresetId, version: number): Promise<string> {
        const cacheKey = `proxy::${presetId}::${text}`;
        const cached = this.blobUrlCache.get(cacheKey);
        if (cached) return cached;

        const [language, gender] = presetId.split('-') as ['vi' | 'en', 'female' | 'male'];
        const controller = new AbortController();
        this.activeAbortController = controller;

        const res = await fetch(TTS_PROXY_SYNTHESIZE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, language, gender, engine: 'auto' }),
            signal: controller.signal,
        });

        if (!res.ok) {
            throw new Error(`TTS proxy HTTP ${res.status}`);
        }

        const blob = await res.blob();
        if (version !== this.playbackVersion) {
            throw new DOMException('Aborted', 'AbortError');
        }

        const blobUrl = URL.createObjectURL(blob);
        this.blobUrlCache.set(cacheKey, blobUrl);
        return blobUrl;
    }

    private resolveUrlForVoice(sentence: TtsSentence, voiceId: TtsPresetId): string | undefined {
        switch (voiceId) {
            case 'vi-female':
                return sentence.audioUrlViFemale || sentence.audioUrlFemale || undefined;
            case 'vi-male':
                return sentence.audioUrlViMale || sentence.audioUrlMale || undefined;
            case 'en-female':
                return sentence.audioUrlEnFemale || undefined;
            case 'en-male':
                return sentence.audioUrlEnMale || undefined;
        }
    }

    private playCurrent() {
        if (this.sentences.length === 0) return;
        if (this.currentIndex < 0 || this.currentIndex >= this.sentences.length) {
            this.stop();
            this.onFinishedAll?.();
            return;
        }

        this.clearPlayback();
        const version = this.playbackVersion;

        const sentence = this.sentences[this.currentIndex];
        this.onSentenceChange?.(sentence, this.currentIndex);

        const primaryUrl = this.resolveUrlForVoice(sentence, this.selectedVoiceId);
        const backupPreset =
            this.fallbackVoiceId !== 'auto' && this.fallbackVoiceId !== this.selectedVoiceId
                ? this.fallbackVoiceId
                : undefined;
        const backupUrl = backupPreset ? this.resolveUrlForVoice(sentence, backupPreset) : undefined;

        const runBrowserSpeechBackup = () => {
            if (version !== this.playbackVersion) return;
            console.warn('[TTS] Falling back to browser speechSynthesis for:', sentence.text);
            this.playWithWebSpeech(backupPreset ?? this.selectedVoiceId);
        };

        const runLiveProxyOrBackup = () => {
            if (version !== this.playbackVersion) return;
            this.playState = 'playing';
            this.onStateChange?.(this.playState);

            void this.synthesizeLiveProxy(sentence.text, this.selectedVoiceId, version)
                .then((blobUrl) => {
                    if (version !== this.playbackVersion || this.playState !== 'playing') return;
                    this.startAudioElement(blobUrl, version, () => {
                        if (backupUrl) {
                            this.playRemoteOrBlobUrl(backupUrl, version, runBrowserSpeechBackup);
                        } else {
                            runBrowserSpeechBackup();
                        }
                    });
                })
                .catch((err) => {
                    if (version !== this.playbackVersion || (err as any)?.name === 'AbortError') return;
                    if (backupUrl) {
                        this.playRemoteOrBlobUrl(backupUrl, version, runBrowserSpeechBackup);
                    } else {
                        runBrowserSpeechBackup();
                    }
                });
        };

        if (primaryUrl) {
            this.playRemoteOrBlobUrl(primaryUrl, version, (err) => {
                console.warn('[TTS] Primary Dropbox MP3 failed:', primaryUrl, err);
                runLiveProxyOrBackup();
            });
            return;
        }

        runLiveProxyOrBackup();
    }

    private playWithWebSpeech(presetId: TtsPresetId = this.selectedVoiceId) {
        if (!this.synth || this.sentences.length === 0) {
            this.stop();
            return;
        }
        if (this.currentIndex < 0 || this.currentIndex >= this.sentences.length) return;

        const sentence = this.sentences[this.currentIndex];
        const utter = new SpeechSynthesisUtterance(sentence.text);

        const preset = TTS_VOICE_PRESETS.find(v => v.id === presetId) ?? TTS_VOICE_PRESETS[0];
        this.initVoices();
        const langPrefix = preset.lang.slice(0, 2).toLowerCase();
        const matching = this.voices.filter(v => v.lang.toLowerCase().split(/[-_]/)[0] === langPrefix);

        const names: Record<TtsPresetId, RegExp> = {
            'vi-female': /ho[àa]i\s*my|linh|female|\bnu\b|nữ/i,
            'vi-male': /nam\s*minh|an|\bmale\b|\bnam\b/i,
            'en-female': /ava|jenny|zira|aria|samantha|female/i,
            'en-male': /andrew|guy|david|mark|\bmale\b/i,
        };
        const preferred = matching.find(v => names[preset.id].test(v.name));
        const browserVoice =
            preferred ??
            matching.find(v => v.lang.toLowerCase() === preset.lang.toLowerCase()) ??
            matching[0];

        utter.lang = browserVoice?.lang ?? preset.lang;
        if (browserVoice) utter.voice = browserVoice;

        const effectivePitch = preferred
            ? this.pitch
            : preset.gender === 'female'
              ? Math.min(1.4, this.pitch * 1.15)
              : Math.max(0.6, this.pitch * 0.85);

        utter.rate = this.rate;
        utter.pitch = effectivePitch;
        utter.volume = this.volume;

        utter.onend = () => {
            if (this.currentUtterance !== utter || this.playState !== 'playing') return;
            this.handleSentenceFinished();
        };

        utter.onerror = (e) => {
            if (this.currentUtterance !== utter || e.error === 'interrupted' || e.error === 'canceled') return;
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
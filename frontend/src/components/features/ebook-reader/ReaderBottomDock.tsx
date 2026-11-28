import React, { useState } from 'react';
import {
    BookOpen,
    ChevronLeft,
    ChevronRight,
    SkipBack,
    Play,
    Pause,
    Square,
    SkipForward,
    FileText,
    Scroll,
    FileCode,
    Palette,
    Maximize2,
    Settings,
    Sparkles,
} from 'lucide-react';
import type { ReadingMode, ReaderTheme, FontFamily } from '../../../hooks/useEbookReader';
import {
    TTS_VOICE_PRESETS,
    normalizeTtsVoiceId,
} from '../../../services/frontendTtsService';
import type { TtsPlayState, TtsVoiceOption, TtsFallbackId } from '../../../services/frontendTtsService';
import styles from '../../../pages/EbookReaderPage.module.css';

interface Props {
    pageInput: string;
    totalPages: number;
    ttsState: TtsPlayState;
    speechRate: number;
    availableVoices: TtsVoiceOption[];
    selectedVoiceId: string;
    fallbackVoiceId?: TtsFallbackId;
    readingMode: ReadingMode;
    theme: ReaderTheme;
    fontFamily: FontFamily;
    fontSize: number;
    navbarHidden: boolean;
    copilotOpen: boolean;
    tocOpen: boolean;
    onPageInputChange: (val: string) => void;
    onPageJump: () => void;
    onPrevSpread: () => void;
    onNextSpread: () => void;
    onTogglePlayPause: () => void;
    onStopTts: () => void;
    onNextSentence: () => void;
    onPrevSentence: () => void;
    onRateChange: (rate: number) => void;
    onVoiceChange: (voiceId: string) => void;
    onFallbackVoiceChange?: (voiceId: string) => void;
    onReadingModeChange: (mode: ReadingMode) => void;
    onThemeChange: (theme: ReaderTheme) => void;
    onFontFamilyChange: (font: FontFamily) => void;
    onZoomOut: () => void;
    onZoomIn: () => void;
    onToggleNavbar: () => void;
    onToggleCopilot: () => void;
    onToggleToc: () => void;
    onOpenAiSettings: () => void;
}

export const ReaderBottomDock: React.FC<Props> = (props) => {
    const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) void document.documentElement.requestFullscreen();
        else void document.exitFullscreen?.();
    };

    return (
        <div className={styles.bottomDock}>
            {/* 1. Nút Mục lục */}
            <button
                type="button"
                className={`${styles.dockToolBtn} ${props.tocOpen ? styles.activeTool : ''}`}
                onClick={props.onToggleToc}
                title="Mục lục sách (TOC)"
            >
                <BookOpen size={16} />
            </button>

            {/* 2. Điều hướng trang */}
            <button
                type="button"
                className={styles.dockToolBtn}
                onClick={props.onPrevSpread}
                title="Trang trước (←)"
            >
                <ChevronLeft size={16} />
            </button>

            <div className={styles.pageJumpBox}>
                <span>Trang</span>
                <input
                    type="number"
                    className={styles.pageInput}
                    value={props.pageInput}
                    min={1}
                    max={props.totalPages}
                    onChange={(e) => props.onPageInputChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && props.onPageJump()}
                />
                <span className={styles.pageTotal}>/ </span>
                <span className={styles.pageTotal}>{props.totalPages}</span>
                <button type="button" className={styles.jumpGoBtn} onClick={props.onPageJump}>
                    Đến
                </button>
            </div>

            <button
                type="button"
                className={styles.dockToolBtn}
                onClick={props.onNextSpread}
                title="Trang sau (→)"
            >
                <ChevronRight size={16} />
            </button>

            <div className={styles.dockSep} />

            {/* 3. Thanh phát giọng đọc AI TTS */}
            <div className={styles.audioDockGroup}>
                <button
                    type="button"
                    className={styles.dockSubBtn}
                    onClick={props.onPrevSentence}
                    title="Câu trước"
                >
                    <SkipBack size={15} />
                </button>
                <button
                    type="button"
                    className={`${styles.playSpeechBtn} ${props.ttsState === 'playing' ? styles.pulseGlow : ''}`}
                    onClick={props.onTogglePlayPause}
                    title={props.ttsState === 'playing' ? 'Tạm dừng đọc' : 'Phát giọng đọc AI (TTS)'}
                >
                    {props.ttsState === 'playing' ? <Pause size={15} /> : <Play size={15} fill="currentColor" />}
                </button>
                {props.ttsState !== 'idle' && (
                    <button
                        type="button"
                        className={styles.dockSubBtn}
                        onClick={props.onStopTts}
                        title="Dừng đọc"
                    >
                        <Square size={13} fill="currentColor" />
                    </button>
                )}
                <button
                    type="button"
                    className={styles.dockSubBtn}
                    onClick={props.onNextSentence}
                    title="Câu tiếp"
                >
                    <SkipForward size={15} />
                </button>

                {/* Chọn tốc độ đọc */}
                <select
                    className={styles.dockSelect}
                    value={props.speechRate}
                    onChange={(e) => props.onRateChange(parseFloat(e.target.value))}
                    title="Tốc độ giọng đọc"
                >
                    <option value={0.75}>0.75x</option>
                    <option value={1.0}>1.0x</option>
                    <option value={1.25}>1.25x</option>
                    <option value={1.5}>1.5x</option>
                    <option value={2.0}>2.0x</option>
                </select>

                {/* Chọn giọng đọc chính (Tiếng Việt / Tiếng Anh) */}
                <select
                    className={`${styles.dockSelect} ${styles.voiceSelect}`}
                    value={normalizeTtsVoiceId(props.selectedVoiceId)}
                    onChange={(e) => props.onVoiceChange(normalizeTtsVoiceId(e.target.value))}
                    title="Giọng đọc AI (Tiếng Việt / Tiếng Anh)"
                    aria-label="Giọng đọc AI"
                >
                    <optgroup label="Tiếng Việt">
                        {TTS_VOICE_PRESETS.filter(v => v.isVietnamese).map(v => (
                            <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                    </optgroup>
                    <optgroup label="Tiếng Anh">
                        {TTS_VOICE_PRESETS.filter(v => !v.isVietnamese).map(v => (
                            <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                    </optgroup>
                </select>
            </div>

            <div className={styles.dockSep} />

            {/* 4. Chế độ xem trang (Spread, Single, Scroll, PDF Native) */}
            <div className={styles.modeToggleGroup}>
                <button
                    type="button"
                    className={`${styles.modeBtn} ${props.readingMode === 'spread' ? styles.activeMode : ''}`}
                    onClick={() => props.onReadingModeChange('spread')}
                    title="Sách mở đôi (Spread)"
                >
                    <BookOpen size={13} style={{ display: 'inline-block', marginRight: 4, verticalAlign: 'middle' }} />
                    <span>Đôi</span>
                </button>
                <button
                    type="button"
                    className={`${styles.modeBtn} ${props.readingMode === 'single' ? styles.activeMode : ''}`}
                    onClick={() => props.onReadingModeChange('single')}
                    title="Trang đơn (Single)"
                >
                    <FileText size={13} style={{ display: 'inline-block', marginRight: 4, verticalAlign: 'middle' }} />
                    <span>Đơn</span>
                </button>
                <button
                    type="button"
                    className={`${styles.modeBtn} ${props.readingMode === 'scroll' ? styles.activeMode : ''}`}
                    onClick={() => props.onReadingModeChange('scroll')}
                    title="Cuộn dọc liên tục (Scroll)"
                >
                    <Scroll size={13} style={{ display: 'inline-block', marginRight: 4, verticalAlign: 'middle' }} />
                    <span>Cuộn</span>
                </button>
                <button
                    type="button"
                    className={`${styles.modeBtn} ${props.readingMode === 'pdf-native' ? styles.activeMode : ''}`}
                    onClick={() => props.onReadingModeChange('pdf-native')}
                    title="Xem PDF gốc"
                >
                    <FileCode size={13} style={{ display: 'inline-block', marginRight: 4, verticalAlign: 'middle' }} />
                    <span>PDF</span>
                </button>
            </div>

            <div className={styles.dockSep} />

            {/* 5. Menu Tùy chỉnh Giao diện */}
            <div className={styles.popoverAnchor}>
                <button
                    type="button"
                    className={`${styles.dockToolBtn} ${settingsMenuOpen ? styles.activeTool : ''}`}
                    onClick={() => setSettingsMenuOpen((o) => !o)}
                    title="Tùy chỉnh font chữ & màu nền"
                >
                    <Palette size={16} />
                </button>

                {settingsMenuOpen && (
                    <div className={styles.dockSettingsMenu}>
                        <div className={styles.menuRow}>
                            <span className={styles.menuLabel}>Màu nền:</span>
                            <div className={styles.themeOptions}>
                                <button
                                    type="button"
                                    className={`${styles.themeDot} ${styles.dotLight} ${props.theme === 'light' ? styles.activeDot : ''}`}
                                    onClick={() => props.onThemeChange('light')}
                                    title="Sáng hiện đại"
                                />
                                <button
                                    type="button"
                                    className={`${styles.themeDot} ${styles.dotSepia} ${props.theme === 'sepia' ? styles.activeDot : ''}`}
                                    onClick={() => props.onThemeChange('sepia')}
                                    title="Giấy cổ trang (Sepia)"
                                />
                                <button
                                    type="button"
                                    className={`${styles.themeDot} ${styles.dotCream} ${props.theme === 'cream' ? styles.activeDot : ''}`}
                                    onClick={() => props.onThemeChange('cream')}
                                    title="Vàng ngà dịu mắt"
                                />
                                <button
                                    type="button"
                                    className={`${styles.themeDot} ${styles.dotDark} ${props.theme === 'dark' ? styles.activeDot : ''}`}
                                    onClick={() => props.onThemeChange('dark')}
                                    title="Đêm tối huyền bí"
                                />
                            </div>
                        </div>

                        <div className={styles.menuRow}>
                            <span className={styles.menuLabel}>Kiểu chữ:</span>
                            <div className={styles.fontOptions}>
                                <button
                                    type="button"
                                    className={`${styles.fontOptionBtn} ${props.fontFamily === 'serif' ? styles.activeFontOpt : ''}`}
                                    onClick={() => props.onFontFamilyChange('serif')}
                                >
                                    Có chân (Serif)
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.fontOptionBtn} ${props.fontFamily === 'sans' ? styles.activeFontOpt : ''}`}
                                    onClick={() => props.onFontFamilyChange('sans')}
                                >
                                    Không chân (Sans)
                                </button>
                            </div>
                        </div>

                        <div className={styles.menuRow}>
                            <span className={styles.menuLabel}>Cỡ chữ: {props.fontSize}px</span>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button type="button" className={styles.fontOptionBtn} onClick={props.onZoomOut}>
                                    A−
                                </button>
                                <button type="button" className={styles.fontOptionBtn} onClick={props.onZoomIn}>
                                    A+
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <button type="button" className={styles.dockToolBtn} onClick={toggleFullscreen} title="Toàn màn hình">
                <Maximize2 size={16} />
            </button>

            <button
                type="button"
                className={styles.dockToolBtn}
                onClick={props.onOpenAiSettings}
                title="Cấu hình Local LLM (Ollama) & Gemini"
            >
                <Settings size={16} />
            </button>

            <div className={styles.dockSep} />

            {/* 6. Nút AI Copilot */}
            <button
                type="button"
                className={`${styles.aiCopilotToggleBtn} ${props.copilotOpen ? styles.activeAiBtn : ''}`}
                onClick={props.onToggleCopilot}
                title="Mở trợ lý đọc sách AI (Copilot)"
            >
                <Sparkles size={14} style={{ display: 'inline-block', marginRight: 4, verticalAlign: 'middle' }} />
                <span>Hỏi AI</span>
            </button>
        </div>
    );
};
import React from 'react';
import styles from '../../../pages/EbookReaderPage.module.css';

interface Props {
    pageInput: string;
    totalPages: number;
    isPlaying: boolean;
    speechRate: number;
    voiceGender: 'female' | 'male';
    navbarHidden: boolean;
    copilotOpen: boolean;
    onPageInputChange: (val: string) => void;
    onPageJump: () => void;
    onPrevSpread: () => void;
    onNextSpread: () => void;
    onTogglePlayPause: () => void;
    onRateChange: (rate: number) => void;
    onGenderChange: (gender: 'female' | 'male') => void;
    onZoomOut: () => void;
    onZoomIn: () => void;
    onToggleNavbar: () => void;
    onToggleCopilot: () => void;
}

export const ReaderBottomDock: React.FC<Props> = (props) => {
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) void document.documentElement.requestFullscreen();
        else void document.exitFullscreen?.();
    };

    return (
        <div className={styles.bottomDock}>
            <button type="button" className={styles.dockToolBtn} onClick={props.onPrevSpread} title="Trang trước">
                ‹
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
                <span className={styles.pageTotal}>/ {props.totalPages}</span>
                <button type="button" className={styles.jumpGoBtn} onClick={props.onPageJump}>
                    Đến
                </button>
            </div>

            <button type="button" className={styles.dockToolBtn} onClick={props.onNextSpread} title="Trang sau">
                ›
            </button>

            <div className={styles.dockSep} />

            <div className={styles.audioDockGroup}>
                <button type="button" className={styles.playSpeechBtn} onClick={props.onTogglePlayPause}>
                    {props.isPlaying ? '❚❚' : '▶'}
                </button>
                <select
                    className={styles.dockSelect}
                    value={props.speechRate}
                    onChange={(e) => props.onRateChange(parseFloat(e.target.value))}
                >
                    <option value={0.85}>0.85x</option>
                    <option value={1.0}>1.0x</option>
                    <option value={1.25}>1.25x</option>
                    <option value={1.5}>1.5x</option>
                </select>
                <select
                    className={styles.dockSelect}
                    value={props.voiceGender}
                    onChange={(e) => props.onGenderChange(e.target.value as 'female' | 'male')}
                >
                    <option value="female">Nữ AI</option>
                    <option value="male">Nam AI</option>
                </select>
            </div>

            <div className={styles.dockSep} />

            <button type="button" className={styles.dockToolBtn} onClick={props.onZoomOut} title="Thu nhỏ">
                −
            </button>
            <button type="button" className={styles.dockToolBtn} onClick={props.onZoomIn} title="Phóng to">
                +
            </button>
            <button type="button" className={styles.dockToolBtn} onClick={toggleFullscreen} title="Toàn màn hình">
                ⛶
            </button>

            <div className={styles.dockSep} />

            <button
                type="button"
                className={`${styles.dockToolBtn} ${props.navbarHidden ? styles.activeTool : ''}`}
                onClick={props.onToggleNavbar}
                title="Ẩn/Hiện thanh điều hướng"
            >
                ☰
            </button>
            <button
                type="button"
                className={`${styles.dockToolBtn} ${props.copilotOpen ? styles.activeTool : ''}`}
                onClick={props.onToggleCopilot}
                title="Bật/Tắt AI Copilot"
            >
                AI
            </button>
        </div>
    );
};
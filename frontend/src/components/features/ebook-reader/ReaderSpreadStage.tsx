import React, { useRef, useState } from 'react';
import type { BookTtsSegmentDto } from '../../../types/reader';
import styles from '../../../pages/EbookReaderPage.module.css';

interface Props {
    leftPage: number;
    rightPage: number | null;
    totalPages: number;
    leftSegments: BookTtsSegmentDto[];
    rightSegments: BookTtsSegmentDto[];
    loadingPages: boolean;
    scale: number;
    activeSegmentId: number | null;
    ttsEnabled?: boolean;
    chatEnabled?: boolean;
    onPlaySegment: (seg: BookTtsSegmentDto) => void;
    onPrevSpread: () => void;
    onNextSpread: () => void;
    onSendSelectionToCopilot: (selectedText: string) => void;
    children?: React.ReactNode;
}

export const ReaderSpreadStage: React.FC<Props> = ({
    leftPage,
    rightPage,
    totalPages,
    leftSegments,
    rightSegments,
    loadingPages,
    scale,
    activeSegmentId,
    ttsEnabled = true,
    chatEnabled = true,
    onPlaySegment,
    onPrevSpread,
    onNextSpread,
    onSendSelectionToCopilot,
    children,
}) => {
    const stageRef = useRef<HTMLElement | null>(null);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

    const handleMouseUp = (e: React.MouseEvent) => {
        if (!chatEnabled) {
            setTooltip(null);
            return;
        }
        const sel = window.getSelection();
        const text = sel?.toString().trim() ?? '';
        if (text.length > 3 && stageRef.current && sel?.anchorNode && stageRef.current.contains(sel.anchorNode)) {
            setTooltip({ x: e.clientX + 10, y: e.clientY - 40, text });
        } else {
            setTooltip(null);
        }
    };

    const renderPage = (pageNum: number | null, segments: BookTtsSegmentDto[], side: 'left' | 'right') => (
        <article className={`${styles.spreadPage} ${side === 'left' ? styles.leftPage : styles.rightPage}`}>
            <div className={styles.pageContent}>
                {pageNum === null ? (
                    <p className={styles.mutedText}>Hết sách.</p>
                ) : loadingPages ? (
                    <p className={styles.mutedText}>Đang tải nội dung trang {pageNum}...</p>
                ) : segments.length > 0 ? (
                    segments.map((seg) => (
                        <p
                            key={seg.id}
                            className={ttsEnabled ? `${styles.ttsBlock} ${activeSegmentId === seg.id ? styles.ttsReading : ''}` : undefined}
                            onClick={ttsEnabled ? () => onPlaySegment(seg) : undefined}
                            title={ttsEnabled ? 'Bấm để nghe AI đọc đoạn này' : undefined}
                        >
                            {seg.textContent}
                        </p>
                    ))
                ) : (
                    <p className={styles.mutedText}>Trang {pageNum} chưa có đoạn văn bản nào.</p>
                )}
            </div>
            {pageNum !== null && (
                <div className={side === 'left' ? styles.pageNumberLeft : styles.pageNumberRight}>{pageNum}</div>
            )}
        </article>
    );

    return (
        <section ref={stageRef} className={styles.centerStage} onMouseUp={handleMouseUp}>
            <button type="button" className={`${styles.spreadNavBtn} ${styles.prevBtn}`} onClick={onPrevSpread} disabled={leftPage <= 1}>
                ‹
            </button>
            <button
                type="button"
                className={`${styles.spreadNavBtn} ${styles.nextBtn}`}
                onClick={onNextSpread}
                disabled={leftPage + 2 > totalPages}
            >
                ›
            </button>

            <div className={styles.doubleSpread} style={{ transform: `scale(${scale})` }}>
                {renderPage(leftPage, leftSegments, 'left')}
                {renderPage(rightPage, rightSegments, 'right')}
            </div>

            {tooltip && (
                <button
                    type="button"
                    className={styles.selectionTooltip}
                    style={{ left: tooltip.x, top: tooltip.y }}
                    onClick={() => {
                        onSendSelectionToCopilot(tooltip.text);
                        setTooltip(null);
                    }}
                >
                    💡 Gửi vào Copilot
                </button>
            )}

            {children}
        </section>
    );
};
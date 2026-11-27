import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, FileText, Sparkles, Volume2, Copy } from 'lucide-react';
import type { ReaderPageItem, ReadingMode, ReaderTheme, FontFamily } from '../../../hooks/useEbookReader';
import type { TtsSentence } from '../../../services/frontendTtsService';
import styles from '../../../pages/EbookReaderPage.module.css';

interface Props {
    readingMode: ReadingMode;
    theme: ReaderTheme;
    fontFamily: FontFamily;
    fontSize: number;
    lineHeight: number;
    scale: number;
    leftPage: number;
    rightPage: number | null;
    totalPages: number;
    currentLeftPage: ReaderPageItem | null;
    currentRightPage: ReaderPageItem | null;
    allPages: ReaderPageItem[];
    loadingPages: boolean;
    pdfBlobUrl: string | null;
    activeSentence: TtsSentence | null;
    onPlayParagraph: (text: string, pageNumber: number) => void;
    onPrevSpread: () => void;
    onNextSpread: () => void;
    onSendSelectionToCopilot: (selectedText: string) => void;
    children?: React.ReactNode;
}

export const ReaderSpreadStage: React.FC<Props> = ({
    readingMode,
    theme,
    fontFamily,
    fontSize,
    lineHeight,
    scale,
    leftPage,
    rightPage,
    totalPages,
    currentLeftPage,
    currentRightPage,
    allPages,
    loadingPages,
    pdfBlobUrl,
    activeSentence,
    onPlayParagraph,
    onPrevSpread,
    onNextSpread,
    onSendSelectionToCopilot,
    children,
}) => {
    const stageRef = useRef<HTMLElement | null>(null);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

    const handleMouseUp = (e: React.MouseEvent) => {
        const sel = window.getSelection();
        const text = sel?.toString().trim() ?? '';
        if (text.length > 2 && stageRef.current && sel?.anchorNode && stageRef.current.contains(sel.anchorNode)) {
            setTooltip({ x: e.clientX + 8, y: e.clientY - 42, text });
        } else {
            setTooltip(null);
        }
    };

    const fontStyleClass =
        fontFamily === 'serif' ? styles.fontSerif : fontFamily === 'mono' ? styles.fontMono : styles.fontSans;
    const themeClass =
        theme === 'dark'
            ? styles.themeDark
            : theme === 'sepia'
            ? styles.themeSepia
            : theme === 'cream'
            ? styles.themeCream
            : styles.themeLight;

    const renderParagraph = (paraText: string, pageNum: number, pIdx: number) => {
        const isCurrentSentenceHere =
            activeSentence && activeSentence.pageNumber === pageNum && activeSentence.paragraphIndex === pIdx;

        return (
            <p
                key={pIdx}
                className={`${styles.pageParagraph} ${isCurrentSentenceHere ? styles.ttsReadingHighlight : ''}`}
                onClick={() => onPlayParagraph(paraText, pageNum)}
                title="Bấm để nghe AI đọc đoạn này"
                style={{ fontSize: `${fontSize}px`, lineHeight }}
            >
                {paraText}
            </p>
        );
    };

    const renderPageSheet = (pageItem: ReaderPageItem | null, pageNum: number | null, side: 'left' | 'right' | 'single') => {
        const isLeft = side === 'left';
        const isSingle = side === 'single';

        return (
            <article
                className={`${styles.spreadPage} ${
                    isSingle ? styles.singlePageSheet : isLeft ? styles.leftPage : styles.rightPage
                } ${fontStyleClass}`}
            >
                <div className={styles.pageHeaderBar}>
                    <span className={styles.chapterTitleLabel}>{pageItem?.chapterTitle || 'Trang sách'}</span>
                </div>

                <div className={styles.pageContentBody}>
                    {loadingPages ? (
                        <div className={styles.pageLoadingBox}>
                            <div className={styles.spinner} />
                            <span>Đang chuẩn bị trang {pageNum}...</span>
                        </div>
                    ) : pageItem ? (
                        pageItem.paragraphs.map((para, idx) => renderParagraph(para, pageItem.pageNumber, idx))
                    ) : (
                        <p className={styles.mutedText}>Hết nội dung sách.</p>
                    )}
                </div>

                {pageNum !== null && (
                    <footer className={isLeft ? styles.pageNumberLeft : styles.pageNumberRight}>
                        <span>Trang {pageNum}</span>
                    </footer>
                )}
            </article>
        );
    };

    return (
        <section
            ref={stageRef}
            className={`${styles.centerStage} ${themeClass}`}
            onMouseUp={handleMouseUp}
        >
            {/* Phím chuyển trang cố định */}
            {readingMode !== 'scroll' && readingMode !== 'pdf-native' && (
                <>
                    <button
                        type="button"
                        className={`${styles.spreadNavBtn} ${styles.prevBtn}`}
                        onClick={onPrevSpread}
                        disabled={leftPage <= 1}
                        title="Trang trước (←)"
                    >
                        <ChevronLeft size={22} />
                    </button>
                    <button
                        type="button"
                        className={`${styles.spreadNavBtn} ${styles.nextBtn}`}
                        onClick={onNextSpread}
                        disabled={readingMode === 'spread' ? leftPage + 2 > totalPages : leftPage >= totalPages}
                        title="Trang sau (→)"
                    >
                        <ChevronRight size={22} />
                    </button>
                </>
            )}

            {/* Chế độ 1: Native PDF Viewer */}
            {readingMode === 'pdf-native' ? (
                <div className={styles.pdfContainer}>
                    {pdfBlobUrl ? (
                        <iframe
                            src={`${pdfBlobUrl}#page=${leftPage}&view=FitH`}
                            className={styles.pdfFrame}
                            title="Trình xem PDF gốc"
                        />
                    ) : (
                        <div className={styles.emptyPdfNotice}>
                            <p>
                                <FileText size={15} style={{ display: 'inline-block', marginRight: 5, verticalAlign: 'middle' }} />
                                <span>Đang hiển thị bản đọc số hóa. Bấm nút <strong>"Tải PDF về máy"</strong> ở góc trên để tải tệp PDF về máy tính của bạn.</span>
                            </p>
                        </div>
                    )}
                </div>
            ) : readingMode === 'scroll' ? (
                /* Chế độ 2: Cuộn dọc liên tục (Continuous Scroll) */
                <div className={styles.scrollContainer} style={{ transform: `scale(${scale})` }}>
                    {allPages.map((p) => (
                        <div key={p.pageNumber} className={styles.scrollPageCard}>
                            <div className={styles.scrollHeader}>
                                <strong>{p.chapterTitle}</strong>
                                <span>Trang {p.pageNumber} / {totalPages}</span>
                            </div>
                            <div className={`${styles.pageContentBody} ${fontStyleClass}`}>
                                {p.paragraphs.map((para, idx) => renderParagraph(para, p.pageNumber, idx))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : readingMode === 'single' ? (
                /* Chế độ 3: Trang đơn (Single Page) */
                <div className={styles.singlePageStage} style={{ transform: `scale(${scale})` }}>
                    {renderPageSheet(currentLeftPage, leftPage, 'single')}
                </div>
            ) : (
                /* Chế độ 4: Sách mở đôi (Double Spread) */
                <div className={styles.doubleSpread} style={{ transform: `scale(${scale})` }}>
                    {renderPageSheet(currentLeftPage, leftPage, 'left')}
                    {renderPageSheet(currentRightPage, rightPage, 'right')}
                </div>
            )}

            {/* Tooltip khi bôi đen văn bản */}
            {tooltip && (
                <div
                    className={styles.selectionTooltip}
                    style={{ left: Math.min(window.innerWidth - 220, tooltip.x), top: Math.max(10, tooltip.y) }}
                >
                    <button
                        type="button"
                        className={styles.tooltipBtn}
                        onClick={() => {
                            onSendSelectionToCopilot(tooltip.text);
                            setTooltip(null);
                        }}
                    >
                        <Sparkles size={13} style={{ display: 'inline-block', marginRight: 4, verticalAlign: 'middle' }} />
                        <span>Hỏi AI</span>
                    </button>
                    <button
                        type="button"
                        className={styles.tooltipBtn}
                        onClick={() => {
                            onPlayParagraph(tooltip.text, leftPage);
                            setTooltip(null);
                        }}
                    >
                        <Volume2 size={13} style={{ display: 'inline-block', marginRight: 4, verticalAlign: 'middle' }} />
                        <span>Nghe đọc</span>
                    </button>
                    <button
                        type="button"
                        className={styles.tooltipBtn}
                        onClick={() => {
                            navigator.clipboard.writeText(tooltip.text);
                            setTooltip(null);
                        }}
                    >
                        <Copy size={13} style={{ display: 'inline-block', marginRight: 4, verticalAlign: 'middle' }} />
                        <span>Sao chép</span>
                    </button>
                </div>
            )}

            {children}
        </section>
    );
};

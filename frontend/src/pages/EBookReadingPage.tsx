import React, { useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Upload } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import Header from '../components/layout/Header';
import Navbar from '../components/layout/Navbar';
import { useEbookReader } from '../hooks/useEbookReader';
import { ReaderSpreadStage } from '../components/features/ebook-reader/ReaderSpreadStage';
import { ReaderBottomDock } from '../components/features/ebook-reader/ReaderBottomDock';
import { ReaderCopilotSidebar } from '../components/features/ebook-reader/ReaderCopilotSidebar';
import { ReaderTocDrawer } from '../components/features/ebook-reader/ReaderTocDrawer';
import { ReaderAiSettingsModal } from '../components/features/ebook-reader/ReaderAiSettingsModal';
import { SAMPLE_BOOKS } from '../utils/sampleBooks';
import styles from './EbookReaderPage.module.css';

export const EbookReaderPage: React.FC = () => {
    const { bookId } = useParams<{ bookId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const reader = useEbookReader(bookId, location.state?.book);

    const handlePageJump = () => {
        const parsed = parseInt(reader.pageInput, 10);
        if (!Number.isNaN(parsed)) reader.goToPage(parsed);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            void reader.loadUploadedFile(file);
            e.target.value = '';
        }
    };

    const readProgressPercent = Math.round((reader.leftPage / reader.totalPages) * 100);

    return (
        <div className={styles.readerShell}>

            {!reader.navbarHidden && (
                <>
                    <TopBar />
                    <Header />
                    <Navbar />
                </>
            )}

            {/* Thanh điều khiển phụ trên cùng (Sub Status Bar) */}
            <div className={styles.subStatusBar}>
                <div className={styles.statusBarLeft}>
                    <button
                        type="button"
                        className={styles.backBtn}
                        onClick={() => navigate('/my-library')}
                        title="Quay lại tủ sách cá nhân"
                    >
                        <ArrowLeft size={14} style={{ display: 'inline-block', marginRight: 5, verticalAlign: 'middle' }} />
                        <span>Tủ sách</span>
                    </button>

                    <div className={styles.bookMetaBox}>
                        <span className={styles.bookTitleText}>
                            <strong>{reader.bookTitle}</strong>
                        </span>
                        {reader.author && <span className={styles.bookAuthorText}>— {reader.author}</span>}
                    </div>
                </div>

                <div className={styles.statusBarCenter}>
                    {/* Tiến trình đọc */}
                    <div className={styles.progressContainer}>
                        <span className={styles.progressText}>
                            Trang {reader.leftPage} / {reader.totalPages} ({readProgressPercent}%)
                        </span>
                        <div className={styles.progressBarTrack}>
                            <div className={styles.progressBarFill} style={{ width: `${readProgressPercent}%` }} />
                        </div>
                    </div>
                </div>

                <div className={styles.statusBarRight}>
                </div>
            </div>

            {/* Sân khấu đọc chính */}
            <main className={styles.workspace}>
                <ReaderSpreadStage
                    readingMode={reader.readingMode}
                    theme={reader.theme}
                    fontFamily={reader.fontFamily}
                    fontSize={reader.fontSize}
                    lineHeight={reader.lineHeight}
                    scale={reader.scale}
                    leftPage={reader.leftPage}
                    rightPage={reader.rightPage}
                    totalPages={reader.totalPages}
                    currentLeftPage={reader.currentLeftPageData}
                    currentRightPage={reader.currentRightPageData}
                    allPages={reader.pages}
                    loadingPages={reader.loadingPages}
                    pdfBlobUrl={reader.pdfBlobUrl}
                    activeSentence={reader.activeSentence}
                    onPlayParagraph={reader.playSpecificParagraph}
                    onPrevSpread={reader.prevSpread}
                    onNextSpread={reader.nextSpread}
                    onSendSelectionToCopilot={(text) => void reader.askCopilot('Giải thích đoạn trích này', text)}
                >
                    {/* Dock nổi điều khiển phía dưới */}
                    <ReaderBottomDock
                        pageInput={reader.pageInput}
                        totalPages={reader.totalPages}
                        ttsState={reader.ttsState}
                        speechRate={reader.speechRate}
                        availableVoices={reader.availableVoices}
                        selectedVoiceId={reader.selectedVoiceId}
                        fallbackVoiceId={reader.fallbackVoiceId}
                        readingMode={reader.readingMode}
                        theme={reader.theme}
                        fontFamily={reader.fontFamily}
                        fontSize={reader.fontSize}
                        navbarHidden={reader.navbarHidden}
                        copilotOpen={reader.copilotOpen}
                        tocOpen={reader.tocOpen}
                        onPageInputChange={reader.setPageInput}
                        onPageJump={handlePageJump}
                        onPrevSpread={reader.prevSpread}
                        onNextSpread={reader.nextSpread}
                        onTogglePlayPause={reader.togglePlayPause}
                        onStopTts={reader.stopTts}
                        onNextSentence={reader.nextSentence}
                        onPrevSentence={reader.prevSentence}
                        onRateChange={reader.changeSpeechRate}
                        onVoiceChange={reader.changeVoice}
                        onFallbackVoiceChange={reader.changeFallbackVoice}
                        onReadingModeChange={reader.setReadingMode}
                        onThemeChange={reader.setTheme}
                        onFontFamilyChange={reader.setFontFamily}
                        onZoomOut={reader.zoomOut}
                        onZoomIn={reader.zoomIn}
                        onToggleNavbar={reader.toggleNavbar}
                        onToggleCopilot={reader.toggleCopilot}
                        onToggleToc={reader.toggleToc}
                        onOpenAiSettings={() => reader.setAiSettingsOpen(true)}
                    />
                </ReaderSpreadStage>

                {/* Trợ lý AI Copilot bên phải */}
                <ReaderCopilotSidebar
                    isOpen={reader.copilotOpen}
                    messages={reader.messages}
                    isAiLoading={reader.isAiLoading}
                    aiSettings={reader.aiSettings}
                    onClose={reader.toggleCopilot}
                    onAsk={reader.askCopilot}
                    onOpenAiSettings={() => reader.setAiSettingsOpen(true)}
                    onClearChat={reader.clearChat}
                />
            </main>

            {/* Ngăn kéo Mục lục tác phẩm (TOC Drawer) */}
            <ReaderTocDrawer
                isOpen={reader.tocOpen}
                toc={reader.toc}
                currentPage={reader.leftPage}
                onClose={reader.toggleToc}
                onJumpToPage={reader.goToPage}
            />

            {/* Modal cấu hình Local LLM & Gemini */}
            <ReaderAiSettingsModal
                isOpen={reader.aiSettingsOpen}
                settings={reader.aiSettings}
                onClose={() => reader.setAiSettingsOpen(false)}
                onSave={reader.updateAiSettings}
            />

            {/* Thông báo Toast nổi */}
            {reader.toastMessage && <div className={styles.toast}>{reader.toastMessage}</div>}
        </div>
    );
};

export default EbookReaderPage;
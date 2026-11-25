import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import TopBar from '../components/layout/TopBar';
import Header from '../components/layout/Header';
import Navbar from '../components/layout/Navbar';
import { useEbookReader } from '../hooks/useEbookReader';
import { ReaderSpreadStage } from '../components/features/ebook-reader/ReaderSpreadStage';
import { ReaderBottomDock } from '../components/features/ebook-reader/ReaderBottomDock';
import { ReaderCopilotSidebar } from '../components/features/ebook-reader/ReaderCopilotSidebar';
import styles from './EbookReaderPage.module.css';

export const EbookReaderPage: React.FC = () => {
    const { bookId } = useParams<{ bookId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const reader = useEbookReader(bookId, location.state?.book);

    const handlePageJump = () => {
        const parsed = parseInt(reader.pageInput, 10);
        if (!Number.isNaN(parsed)) reader.goToPage(parsed);
    };

    return (
        <div className={styles.readerShell}>
            {!reader.navbarHidden && (
                <>
                    <TopBar />
                    <Header />
                    <Navbar />
                </>
            )}

            <div className={styles.subStatusBar}>
                <button type="button" className={styles.backBtn} onClick={() => navigate('/my-library')}>
                    ← Quay lại Tủ sách
                </button>
                <div>
                    Đang đọc: <strong>{reader.edition?.title ?? 'Đang tải...'}</strong>
                    {reader.edition?.author ? ` — ${reader.edition.author}` : ''}
                </div>
            </div>

            <main className={styles.workspace}>
                <ReaderSpreadStage
                    leftPage={reader.leftPage}
                    rightPage={reader.rightPage}
                    totalPages={reader.totalPages}
                    leftSegments={reader.leftSegments}
                    rightSegments={reader.rightSegments}
                    loadingPages={reader.loadingPages}
                    scale={reader.scale}
                    activeSegmentId={reader.activeSegmentId}
                    onPlaySegment={reader.playSegment}
                    onPrevSpread={reader.prevSpread}
                    onNextSpread={reader.nextSpread}
                    onSendSelectionToCopilot={(text) =>
                        void reader.askCopilot('Giải thích đoạn trích này', text)
                    }
                >
                    <ReaderBottomDock
                        pageInput={reader.pageInput}
                        totalPages={reader.totalPages}
                        isPlaying={reader.isPlaying}
                        speechRate={reader.speechRate}
                        voiceGender={reader.voiceGender}
                        navbarHidden={reader.navbarHidden}
                        copilotOpen={reader.copilotOpen}
                        onPageInputChange={reader.setPageInput}
                        onPageJump={handlePageJump}
                        onPrevSpread={reader.prevSpread}
                        onNextSpread={reader.nextSpread}
                        onTogglePlayPause={reader.togglePlayPause}
                        onRateChange={reader.changeSpeechRate}
                        onGenderChange={reader.changeVoiceGender}
                        onZoomOut={reader.zoomOut}
                        onZoomIn={reader.zoomIn}
                        onToggleNavbar={reader.toggleNavbar}
                        onToggleCopilot={reader.toggleCopilot}
                    />
                </ReaderSpreadStage>

                <ReaderCopilotSidebar
                    isOpen={reader.copilotOpen}
                    messages={reader.messages}
                    onClose={reader.toggleCopilot}
                    onAsk={reader.askCopilot}
                />
            </main>

            {reader.toastMessage && <div className={styles.toast}>{reader.toastMessage}</div>}
        </div>
    );
};

export default EbookReaderPage;
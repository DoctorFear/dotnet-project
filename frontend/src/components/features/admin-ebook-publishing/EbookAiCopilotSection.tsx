import React, { useState } from 'react';
import { Sparkles, Send, Loader2, ChevronDown, ChevronUp, BookOpen, CheckCircle2, XCircle } from 'lucide-react';
import type { CopilotTestResponse } from '../../../types/ebookPublishing';
import styles from './EbookPublishingModal.module.css';

interface Props {
    chatAiEnabled: boolean;
    isScan: boolean;
    isBusy: boolean;
    totalEmbeddings: number;
    editionId: number | null;
    isPublished: boolean;
    copilotQuestion: string;
    copilotResponse: CopilotTestResponse | null;
    isTestingCopilot: boolean;
    onChangeQuestion: (q: string) => void;
    onTestCopilot: (q: string) => void;
}

export const EbookAiCopilotSection: React.FC<Props> = ({
    chatAiEnabled,
    isScan,
    isBusy,
    totalEmbeddings,
    editionId,
    isPublished,
    copilotQuestion,
    copilotResponse,
    isTestingCopilot,
    onChangeQuestion,
    onTestCopilot,
}) => {
    const [isTesterOpen, setIsTesterOpen] = useState<boolean>(false);

    return (
        <section className={styles.section} aria-labelledby="ebook-ai-step">
            <h3 id="ebook-ai-step">
                <span>3</span>Trợ lý đọc sách thông minh (E-Book AI Copilot)
            </h3>

            <div className={styles.features}>
                <div className={styles.feature} style={{ cursor: 'default' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong>Trợ lý giải nghĩa & Hỏi đáp AI (RAG Copilot)</strong>
                            {totalEmbeddings > 0 && (
                                <span className={styles.badgeSuccess}>
                                    <Sparkles size={11} style={{ display: 'inline', marginRight: 3 }} />
                                    {totalEmbeddings} vector tri thức đã nạp
                                </span>
                            )}
                        </div>
                        <p>
                            Khi xuất bản, hệ thống tự động bóc tách nội dung, phân đoạn (Chunking) và nạp vector tri thức lên Gemini AI để độc giả có thể hỏi đáp hoặc giải nghĩa câu văn khi đọc sách.
                        </p>
                    </div>
                    <div>
                        {!isScan && chatAiEnabled ? (
                            <span className={styles.badgeSuccess} title="Tự động bật theo cấu hình chuẩn của phân loại">
                                <CheckCircle2 size={12} style={{ display: 'inline', marginRight: 3 }} /> Bật mặc định
                            </span>
                        ) : (
                            <span className={styles.badgeNone} title="Phân loại hiện tại không áp dụng Trợ lý AI">
                                <XCircle size={12} style={{ display: 'inline', marginRight: 3 }} /> Không áp dụng
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Khung kiểm tra thử AI Copilot dành cho Chuyên viên Staff */}
            {editionId && !isScan && (
                <div className={styles.testerContainer}>
                    <button
                        type="button"
                        className={styles.testerToggleBtn}
                        onClick={() => setIsTesterOpen(!isTesterOpen)}
                    >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Sparkles size={14} color="#1e40af" />
                            <strong>Kiểm tra thử nghiệm Trợ lý AI Copilot</strong>
                        </span>
                        {isTesterOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {isTesterOpen && (
                        <div className={styles.testerBody}>
                            {!isPublished && totalEmbeddings === 0 ? (
                                <p className={styles.mutedNotice}>
                                    Ấn bản chưa được xuất bản. Vui lòng bấm “Xuất bản” để hệ thống trích xuất và lập chỉ mục tri thức AI trước khi kiểm tra hỏi đáp.
                                </p>
                            ) : (
                                <>
                                    <div className={styles.testerInputRow}>
                                        <input
                                            type="text"
                                            className={styles.testerInput}
                                            placeholder="Nhập câu hỏi test nội dung cuốn sách..."
                                            value={copilotQuestion}
                                            onChange={e => onChangeQuestion(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' && !isTestingCopilot && copilotQuestion.trim()) {
                                                    onTestCopilot(copilotQuestion);
                                                }
                                            }}
                                            disabled={isTestingCopilot || isBusy}
                                        />
                                        <button
                                            type="button"
                                            className={styles.primaryButton}
                                            style={{ padding: '8px 14px', fontSize: '12px' }}
                                            onClick={() => onTestCopilot(copilotQuestion)}
                                            disabled={isTestingCopilot || !copilotQuestion.trim() || isBusy}
                                        >
                                            {isTestingCopilot ? (
                                                <Loader2 size={14} className={styles.spinner} />
                                            ) : (
                                                <>
                                                    <Send size={13} /> Hỏi thử
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {copilotResponse && (
                                        <div className={styles.testerResponseBox}>
                                            <p className={styles.testerAnswerTitle}>
                                                <strong>Câu trả lời từ Gemini RAG:</strong>
                                            </p>
                                            <div className={styles.testerAnswerContent}>
                                                {copilotResponse.answer}
                                            </div>

                                            {copilotResponse.citations.length > 0 && (
                                                <div className={styles.testerCitations}>
                                                    <small>
                                                        <BookOpen size={11} style={{ display: 'inline', marginRight: 4 }} />
                                                        Đã trích dẫn từ {copilotResponse.citations.length} đoạn văn bản (Trang{' '}
                                                        {Array.from(new Set(copilotResponse.citations.map(c => c.pageNumber))).join(', ')})
                                                    </small>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};

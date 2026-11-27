import React, { useEffect, useRef, useState } from 'react';
import {
    Sparkles,
    Server,
    Cpu,
    Zap,
    Cloud,
    Settings,
    Trash2,
    X,
    FileText,
    Search,
    Lightbulb,
    HelpCircle,
    Send,
    Loader2,
} from 'lucide-react';
import type { ReaderChatMessage } from '../../../hooks/useEbookReader';
import type { AiSettings } from '../../../services/aiCopilotService';
import styles from '../../../pages/EbookReaderPage.module.css';

interface Props {
    isOpen: boolean;
    messages: ReaderChatMessage[];
    isAiLoading: boolean;
    aiSettings: AiSettings;
    onClose: () => void;
    onAsk: (question: string) => Promise<void>;
    onOpenAiSettings: () => void;
    onClearChat: () => void;
}

export const ReaderCopilotSidebar: React.FC<Props> = ({
    isOpen,
    messages,
    isAiLoading,
    aiSettings,
    onClose,
    onAsk,
    onOpenAiSettings,
    onClearChat,
}) => {
    const [input, setInput] = useState('');
    const bodyRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }, [messages, isAiLoading]);

    const handleSend = () => {
        if (!input.trim() || isAiLoading) return;
        const q = input;
        setInput('');
        void onAsk(q);
    };

    const getProviderBadge = (provider?: string, modelName?: string) => {
        if (provider === 'local-llm') {
            return (
                <span className={styles.badgeLocalLlm} title="Phản hồi từ Local LLM (Ollama/LM Studio)">
                    <Server size={11} style={{ display: 'inline-block', marginRight: 4, verticalAlign: 'middle' }} />
                    Local LLM ({modelName || 'Ollama'})
                </span>
            );
        }
        if (provider === 'gemini') {
            return (
                <span className={styles.badgeGemini} title="Phản hồi từ Google Gemini">
                    <Sparkles size={11} style={{ display: 'inline-block', marginRight: 4, verticalAlign: 'middle' }} />
                    Gemini AI
                </span>
            );
        }
        if (provider === 'offline-rules') {
            return (
                <span className={styles.badgeOffline} title="Trợ lý phân tích văn bản ngoại tuyến">
                    <Cpu size={11} style={{ display: 'inline-block', marginRight: 4, verticalAlign: 'middle' }} />
                    Trợ lý Cục bộ
                </span>
            );
        }
        return null;
    };

    return (
        <aside className={`${styles.copilotSidebar} ${!isOpen ? styles.collapsed : ''}`}>
            <div className={styles.copilotHeader}>
                <div className={styles.copilotHeaderLeft}>
                    <div className={styles.copilotTitle}>ancientBOOK Copilot</div>
                    <div className={styles.copilotStatus}>
                        {aiSettings.providerMode === 'auto' ? (
                            <>
                                <Zap size={11} style={{ display: 'inline-block', marginRight: 3, verticalAlign: 'middle' }} />
                                <span>Tự động: Gemini ưu tiên -&gt; Local LLM Fallback</span>
                            </>
                        ) : aiSettings.providerMode === 'local' ? (
                            <>
                                <Server size={11} style={{ display: 'inline-block', marginRight: 3, verticalAlign: 'middle' }} />
                                <span>Local LLM ({aiSettings.localModelName})</span>
                            </>
                        ) : (
                            <>
                                <Cloud size={11} style={{ display: 'inline-block', marginRight: 3, verticalAlign: 'middle' }} />
                                <span>Google Gemini</span>
                            </>
                        )}
                    </div>
                </div>
                <div className={styles.copilotHeaderActions}>
                    <button
                        type="button"
                        className={styles.headerIconBtn}
                        onClick={onOpenAiSettings}
                        title="Cấu hình AI & Local LLM"
                    >
                        <Settings size={15} />
                    </button>
                    <button
                        type="button"
                        className={styles.headerIconBtn}
                        onClick={onClearChat}
                        title="Xóa lịch sử chat"
                    >
                        <Trash2 size={15} />
                    </button>
                    <button
                        type="button"
                        className={styles.closeCopilotBtn}
                        onClick={onClose}
                        title="Đóng thanh AI"
                    >
                        <X size={15} />
                    </button>
                </div>
            </div>

            <div ref={bodyRef} className={styles.copilotBody}>
                {messages.map((m) => (
                    <div
                        key={m.id}
                        className={`${styles.chatMsg} ${m.role === 'user' ? styles.userMsg : styles.botMsg}`}
                    >
                        <div className={styles.msgBubble}>
                            {m.role === 'bot' && (
                                <div className={styles.msgMeta}>
                                    {getProviderBadge(m.provider, m.modelName)}
                                </div>
                            )}
                            <div className={styles.msgText}>{m.content}</div>
                        </div>
                    </div>
                ))}

                {isAiLoading && (
                    <div className={`${styles.chatMsg} ${styles.botMsg}`}>
                        <div className={`${styles.msgBubble} ${styles.loadingBubble}`}>
                            <span className={styles.dotPulse} />
                            <span style={{ fontSize: '12px', color: '#5b6e99', marginLeft: '8px' }}>
                                AI đang đọc ngữ cảnh trang và suy ngẫm...
                            </span>
                        </div>
                    </div>
                )}

                <div className={styles.presetChips}>
                    <button
                        type="button"
                        className={styles.queryChip}
                        disabled={isAiLoading}
                        onClick={() => void onAsk('Tóm tắt ý chính của trang sách đang mở')}
                    >
                        <FileText size={12} style={{ display: 'inline-block', marginRight: 4, verticalAlign: 'middle' }} />
                        <span>Tóm tắt nội dung trang này</span>
                    </button>
                    <button
                        type="button"
                        className={styles.queryChip}
                        disabled={isAiLoading}
                        onClick={() => void onAsk('Giải thích từ cổ, tiếng địa phương và thuật ngữ khó trong trang này')}
                    >
                        <Search size={12} style={{ display: 'inline-block', marginRight: 4, verticalAlign: 'middle' }} />
                        <span>Giải thích từ ngữ & điển tích</span>
                    </button>
                    <button
                        type="button"
                        className={styles.queryChip}
                        disabled={isAiLoading}
                        onClick={() => void onAsk('Phân tích tâm lý nhân vật và bối cảnh nghệ thuật trong trang này')}
                    >
                        <Lightbulb size={12} style={{ display: 'inline-block', marginRight: 4, verticalAlign: 'middle' }} />
                        <span>Phân tích nhân vật & nghệ thuật</span>
                    </button>
                    <button
                        type="button"
                        className={styles.queryChip}
                        disabled={isAiLoading}
                        onClick={() => void onAsk('Đặt 1 câu hỏi gợi mở suy ngẫm về đoạn văn trên trang này')}
                    >
                        <HelpCircle size={12} style={{ display: 'inline-block', marginRight: 4, verticalAlign: 'middle' }} />
                        <span>Câu hỏi gợi mở suy ngẫm</span>
                    </button>
                </div>
            </div>

            <div className={styles.copilotInputBox}>
                <textarea
                    rows={2}
                    className={styles.copilotInput}
                    placeholder="Hỏi AI bất kỳ điều gì về cuốn sách..."
                    value={input}
                    disabled={isAiLoading}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                />
                <button
                    type="button"
                    className={styles.copilotSendBtn}
                    onClick={handleSend}
                    disabled={isAiLoading || !input.trim()}
                >
                    {isAiLoading ? (
                        <Loader2 size={14} className={styles.spinner} />
                    ) : (
                        <>
                            <Send size={13} style={{ display: 'inline-block', marginRight: 4, verticalAlign: 'middle' }} />
                            <span>Gửi</span>
                        </>
                    )}
                </button>
            </div>
        </aside>
    );
};

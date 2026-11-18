import React, { useEffect, useRef, useState } from 'react';
import type { ReaderChatMessage } from '../../../hooks/useEbookReader';
import styles from '../../../pages/EbookReaderPage.module.css';

interface Props {
    isOpen: boolean;
    messages: ReaderChatMessage[];
    onClose: () => void;
    onAsk: (question: string) => Promise<void>;
}

export const ReaderCopilotSidebar: React.FC<Props> = ({ isOpen, messages, onClose, onAsk }) => {
    const [input, setInput] = useState('');
    const bodyRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;
        const q = input;
        setInput('');
        void onAsk(q);
    };

    return (
        <aside className={`${styles.copilotSidebar} ${!isOpen ? styles.collapsed : ''}`}>
            <div className={styles.copilotHeader}>
                <div>
                    <div className={styles.copilotTitle}>ancientBOOK Copilot</div>
                    <div className={styles.copilotStatus}>Trợ lý Đọc & Nghiên cứu Sách</div>
                </div>
                <button type="button" className={styles.closeCopilotBtn} onClick={onClose}>
                    ✕
                </button>
            </div>

            <div ref={bodyRef} className={styles.copilotBody}>
                {messages.map((m) => (
                    <div key={m.id} className={`${styles.chatMsg} ${m.role === 'user' ? styles.userMsg : styles.botMsg}`}>
                        <div className={styles.msgBubble}>{m.content}</div>
                    </div>
                ))}
                <div className={styles.presetChips}>
                    <button type="button" className={styles.queryChip} onClick={() => void onAsk('Tóm tắt ý chính của trang sách đang mở')}>
                        📝 Tóm tắt nội dung trang này
                    </button>
                    <button type="button" className={styles.queryChip} onClick={() => void onAsk('Giải thích thuật ngữ khó trong trang này')}>
                        🔍 Giải thích thuật ngữ & bối cảnh
                    </button>
                </div>
            </div>

            <div className={styles.copilotInputBox}>
                <input
                    type="text"
                    className={styles.copilotInput}
                    placeholder="Hỏi AI về nội dung sách..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button type="button" className={styles.copilotSendBtn} onClick={handleSend}>
                    Gửi
                </button>
            </div>
        </aside>
    );
};
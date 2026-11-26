import React, { useState } from 'react';
import { aiCopilotService, type AiSettings } from '../../../services/aiCopilotService';
import styles from '../../../pages/EbookReaderPage.module.css';

interface Props {
    isOpen: boolean;
    settings: AiSettings;
    onClose: () => void;
    onSave: (updated: Partial<AiSettings>) => void;
}

export const ReaderAiSettingsModal: React.FC<Props> = ({ isOpen, settings, onClose, onSave }) => {
    const [localSettings, setLocalSettings] = useState<AiSettings>({ ...settings });
    const [testResult, setTestResult] = useState<{ loading: boolean; ok?: boolean; message?: string; models?: string[] }>({
        loading: false,
    });

    if (!isOpen) return null;

    const handleTestConnection = async () => {
        setTestResult({ loading: true });
        const res = await aiCopilotService.testLocalLlmConnection(localSettings.localLlmEndpoint);
        setTestResult({
            loading: false,
            ok: res.ok,
            message: res.message,
            models: res.models,
        });
    };

    const handleSave = () => {
        onSave(localSettings);
        onClose();
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.settingsModal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.settingsHeader}>
                    <h3>⚙️ Cấu hình Trợ lý AI & Local LLM Fallback</h3>
                    <button type="button" className={styles.closeBtn} onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className={styles.settingsBody}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Chế độ hoạt động AI:</label>
                        <select
                            className={styles.formSelect}
                            value={localSettings.providerMode}
                            onChange={(e) =>
                                setLocalSettings((prev) => ({ ...prev, providerMode: e.target.value as any }))
                            }
                        >
                            <option value="auto">⚡ Tự động: Gemini ưu tiên ➔ Local LLM Fallback (Khuyên dùng)</option>
                            <option value="gemini">☁️ Chỉ dùng Google Gemini (Cloud API)</option>
                            <option value="local">🏠 Chỉ dùng Local LLM (Ollama / LM Studio cục bộ)</option>
                        </select>
                        <span className={styles.formHint}>
                            Khi chọn Tự động, hệ thống sẽ gọi Gemini trước. Nếu Gemini quá tải, mất mạng hoặc hết quota,
                            hệ thống lập tức chuyển sang Local LLM trên máy bạn mà không làm gián đoạn việc đọc.
                        </span>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Địa chỉ Local LLM Endpoint:</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                className={styles.formInput}
                                value={localSettings.localLlmEndpoint}
                                placeholder="http://localhost:11434"
                                onChange={(e) =>
                                    setLocalSettings((prev) => ({ ...prev, localLlmEndpoint: e.target.value }))
                                }
                            />
                            <button
                                type="button"
                                className={styles.testBtn}
                                onClick={handleTestConnection}
                                disabled={testResult.loading}
                            >
                                {testResult.loading ? 'Đang test...' : 'Kiểm tra'}
                            </button>
                        </div>
                        <span className={styles.formHint}>
                            Mặc định Ollama: <code>http://localhost:11434</code> | LM Studio: <code>http://localhost:1234</code>
                        </span>
                    </div>

                    {testResult.message && (
                        <div
                            className={testResult.ok ? styles.testSuccess : styles.testError}
                        >
                            <strong>{testResult.ok ? '✓ Thành công:' : '✗ Không kết nối được:'}</strong> {testResult.message}
                            {testResult.models && testResult.models.length > 0 && (
                                <div style={{ marginTop: '4px', fontSize: '11.5px' }}>
                                    Models khả dụng: {testResult.models.slice(0, 5).join(', ')}
                                </div>
                            )}
                        </div>
                    )}

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Tên Model Local:</label>
                        <input
                            type="text"
                            className={styles.formInput}
                            value={localSettings.localModelName}
                            placeholder="llama3.2 hoặc mistral, qwen2.5"
                            onChange={(e) =>
                                setLocalSettings((prev) => ({ ...prev, localModelName: e.target.value }))
                            }
                        />
                        <span className={styles.formHint}>
                            Ví dụ: <code>llama3.2</code>, <code>llama3</code>, <code>mistral</code>, <code>qwen2.5</code>, <code>phi3</code>
                        </span>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Nhiệt độ sáng tạo (Temperature): {localSettings.temperature}</label>
                        <input
                            type="range"
                            min="0.1"
                            max="1.0"
                            step="0.1"
                            value={localSettings.temperature}
                            onChange={(e) =>
                                setLocalSettings((prev) => ({ ...prev, temperature: parseFloat(e.target.value) }))
                            }
                        />
                    </div>
                </div>

                <div className={styles.settingsFooter}>
                    <button type="button" className={styles.cancelBtn} onClick={onClose}>
                        Hủy
                    </button>
                    <button type="button" className={styles.saveBtn} onClick={handleSave}>
                        Lưu cấu hình
                    </button>
                </div>
            </div>
        </div>
    );
};

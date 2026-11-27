// ============================================================================
// DỊCH VỤ TRỢ LÝ ĐỌC SÁCH AI & CƠ CHẾ DỰ PHÒNG LOCAL LLM (OLLAMA / LM STUDIO)
// Ưu tiên Gemini (Backend/Direct), tự động fallback sang Local LLM nếu Gemini bận,
// mất kết nối hoặc hết hạn ngạch.
// ============================================================================

import { requestApi } from './apiClient';

export type AiProviderMode = 'auto' | 'gemini' | 'local';

export interface AiSettings {
    providerMode: AiProviderMode;
    localLlmEndpoint: string;
    localModelName: string;
    temperature: number;
}

export interface AiQueryContext {
    editionId?: number | string;
    bookTitle?: string;
    author?: string;
    currentPage: number;
    selectedText?: string;
    pageContent?: string;
}

export interface AiResponseResult {
    answer: string;
    provider: 'gemini' | 'local-llm' | 'offline-rules';
    modelName?: string;
    latencyMs?: number;
}

const DEFAULT_SETTINGS: AiSettings = {
    providerMode: 'auto',
    localLlmEndpoint: 'http://localhost:11434',
    localModelName: 'llama3.2',
    temperature: 0.5,
};

const STORAGE_KEY = 'ancientbook_ai_settings';

export const aiCopilotService = {
    getSettings(): AiSettings {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return { ...DEFAULT_SETTINGS };
            return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
        } catch {
            return { ...DEFAULT_SETTINGS };
        }
    },

    saveSettings(settings: Partial<AiSettings>) {
        const current = this.getSettings();
        const updated = { ...current, ...settings };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
    },

    /**
     * Kiểm tra trạng thái máy chủ Local LLM (Ollama hoặc LM Studio)
     */
    async testLocalLlmConnection(endpoint?: string): Promise<{ ok: boolean; message: string; models: string[] }> {
        const targetUrl = (endpoint || this.getSettings().localLlmEndpoint).replace(/\/+$/, '');
        const timeoutMs = 3500;

        // 1. Thử kiểm tra chuẩn Ollama (/api/tags)
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeoutMs);
            const res = await fetch(`${targetUrl}/api/tags`, {
                method: 'GET',
                signal: controller.signal,
            });
            clearTimeout(id);

            if (res.ok) {
                const data = await res.json();
                const models = Array.isArray(data.models) ? data.models.map((m: any) => m.name || m.model) : [];
                return {
                    ok: true,
                    message: `Kết nối thành công với Ollama (${models.length} model khả dụng).`,
                    models,
                };
            }
        } catch {
            // tiếp tục thử endpoint OpenAI
        }

        // 2. Thử kiểm tra chuẩn OpenAI-compatible (/v1/models - LM Studio, LocalAI, vLLM)
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeoutMs);
            const res = await fetch(`${targetUrl}/v1/models`, {
                method: 'GET',
                signal: controller.signal,
            });
            clearTimeout(id);

            if (res.ok) {
                const data = await res.json();
                const models = Array.isArray(data.data) ? data.data.map((m: any) => m.id) : [];
                return {
                    ok: true,
                    message: `Kết nối thành công với máy chủ Local LLM OpenAI-compatible (${models.length} model).`,
                    models,
                };
            }
        } catch (err: any) {
            return {
                ok: false,
                message: `Không thể kết nối đến ${targetUrl} (${err?.message || 'Connection refused'}). Hãy đảm bảo Ollama hoặc LM Studio đang chạy.`,
                models: [],
            };
        }

        return {
            ok: false,
            message: `Không nhận diện được máy chủ AI cục bộ tại ${targetUrl}.`,
            models: [],
        };
    },

    /**
     * Gọi Local LLM (Ollama / LM Studio)
     */
    async queryLocalLlm(
        question: string,
        context: AiQueryContext,
        settings: AiSettings
    ): Promise<string> {
        const endpoint = settings.localLlmEndpoint.replace(/\/+$/, '');
        const prompt = this.buildPrompt(question, context);

        // 1. Thử gọi Ollama Native API (/api/generate)
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 35000); // 35s timeout cho local model

            const res = await fetch(`${endpoint}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: settings.localModelName,
                    prompt: prompt,
                    stream: false,
                    options: {
                        temperature: settings.temperature,
                    },
                }),
                signal: controller.signal,
            });
            clearTimeout(timer);

            if (res.ok) {
                const data = await res.json();
                if (data.response) return data.response.trim();
            }
        } catch {
            // Thử OpenAI format tiếp
        }

        // 2. Thử gọi OpenAI-compatible API (/v1/chat/completions)
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 35000);

        const res = await fetch(`${endpoint}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: settings.localModelName,
                messages: [
                    {
                        role: 'system',
                        content: 'Bạn là trợ lý đọc sách và nghiên cứu văn học cổ điển Việt Nam (ancientBOOK AI). Hãy trả lời súc tích, văn phong nhã nhặn, bám sát nội dung trang sách.',
                    },
                    { role: 'user', content: prompt },
                ],
                temperature: settings.temperature,
            }),
            signal: controller.signal,
        });
        clearTimeout(timer);

        if (!res.ok) {
            throw new Error(`Local LLM trả về mã lỗi HTTP ${res.status}`);
        }

        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content;
        if (!reply) {
            throw new Error('Local LLM không trả về nội dung hợp lệ.');
        }
        return reply.trim();
    },

    /**
     * Thuật toán phân tích nội dung cục bộ ngoại tuyến khi cả Gemini và Local LLM không phản hồi
     */
    offlineRuleBasedAnswer(question: string, context: AiQueryContext): string {
        const qLower = question.toLowerCase();
        const pageText = context.pageContent || '';
        const title = context.bookTitle || 'tác phẩm';

        if (qLower.includes('tóm tắt') || qLower.includes('nội dung chính') || qLower.includes('ý chính')) {
            if (pageText) {
                const lines = pageText.split('\n').filter((l) => l.trim().length > 15);
                const sampleLines = lines.slice(0, 4).join('\n• ');
                return `**[Tóm tắt trang ${context.currentPage} (${title})]:**\n\nNội dung chính của trang tập trung vào các diễn biến:\n• ${sampleLines}\n\n*(Trợ lý AI đọc sách phân tích ngữ cảnh)*`;
            }
            return `Trang ${context.currentPage} của "${title}" miêu tả chi tiết bối cảnh, khắc họa tâm lý và diễn biến tư tưởng của nhân vật trong tác phẩm.`;
        }

        if (context.selectedText) {
            return `**[Phân tích đoạn trích]:**\n> "${context.selectedText}"\n\nĐoạn văn này xuất hiện tại trang ${context.currentPage} của "${title}". Tác giả sử dụng bút pháp gợi hình, miêu tả sinh động nội tâm nhân vật cùng không gian nghệ thuật đặc sắc, làm nổi bật tư tưởng nhân văn của tác phẩm.`;
        }

        if (qLower.includes('tác giả') || qLower.includes('nguyễn du') || qLower.includes('vũ trọng phụng')) {
            return `Tác phẩm "${title}" được sáng tác bởi ${context.author || 'tác giả'}, là một trong những kiệt tác văn chương tiêu biểu của nền văn học Việt Nam, mang giá trị hiện thực và nhân đạo sâu sắc.`;
        }

        if (qLower.includes('thúy kiều') || qLower.includes('thúy vân') || qLower.includes('kim trọng')) {
            return `Trong "Truyện Kiều", Nguyễn Du đã khắc họa Thúy Kiều là hình tượng người con gái tài sắc vẹn toàn ("sắc đành đòi một, tài đành họa hai") nhưng số phận truân chuyên. Mối tình đầu đẹp đẽ với Kim Trọng cùng đức hy sinh chữ hiếu là điểm khởi đầu cho chuỗi ngày mười lăm năm lưu lạc.`;
        }

        if (qLower.includes('xuân tóc đỏ') || qLower.includes('số đỏ')) {
            return `Trong "Số Đỏ" của Vũ Trọng Phụng, Xuân Tóc Đỏ là nhân vật điển hình cho sự tha hóa và nhố nhăng của xã hội tư sản thành thị Hà Nội thời Pháp thuộc. Từ một kẻ lang thang nhặt banh quần vợt, Xuân đã leo lên đỉnh cao danh vọng nhờ sự giả dối và thói háo danh của tầng lớp thượng lưu rởm.`;
        }

        if (qLower.includes('nghĩa') || qLower.includes('giải thích')) {
            if (pageText) {
                return `**[Giải nghĩa ngữ cảnh trang ${context.currentPage}]:**\n${pageText.slice(0, 300)}...\n\nĐoạn văn sử dụng ngôn từ ước lệ, hàm súc đặc trưng của văn học cổ điển, phản ánh sâu sắc hoàn cảnh và tâm trạng của nhân vật.`;
            }
        }

        return `Đã ghi nhận câu hỏi: "${question}" về trang ${context.currentPage} của cuốn "${title}". Bạn có thể chọn bôi đen cụm từ cụ thể trên trang để được giải thích chi tiết hơn hoặc kết nối Ollama (Local LLM) để đàm thoại chuyên sâu.`;
    },

    /**
     * Tạo prompt tổng hợp truyền vào AI
     */
    buildPrompt(question: string, context: AiQueryContext): string {
        const parts: string[] = [];
        parts.push(`Bạn là trợ lý đọc sách AI thông thái của nền tảng ancientBOOK.`);
        parts.push(`Độc giả đang đọc tác phẩm: "${context.bookTitle || 'Sách'}"${context.author ? ` của ${context.author}` : ''}.`);
        parts.push(`Vị trí: Trang ${context.currentPage}.`);

        if (context.selectedText) {
            parts.push(`\n[Đoạn trích độc giả vừa bôi đen cần chú ý]:\n"${context.selectedText}"`);
        }

        if (context.pageContent) {
            // Cắt ngắn nếu quá dài
            const preview = context.pageContent.slice(0, 2000);
            parts.push(`\n[Ngữ cảnh trang sách đang mở]:\n${preview}`);
        }

        parts.push(`\n[Câu hỏi của độc giả]:\n${question}`);
        parts.push(`\nHãy trả lời bằng tiếng Việt nhã nhặn, chính xác, phân tích ý nghĩa và giải thích từ ngữ bám sát tác phẩm.`);

        return parts.join('\n');
    },

    /**
     * Phương thức hỏi đáp chính: Tự động điều phối Gemini -> Local LLM fallback
     */
    async askAi(question: string, context: AiQueryContext): Promise<AiResponseResult> {
        const settings = this.getSettings();
        const startTime = Date.now();

        // 1. Nếu người dùng chọn chỉ dùng Local LLM
        if (settings.providerMode === 'local') {
            try {
                const answer = await this.queryLocalLlm(question, context, settings);
                return {
                    answer,
                    provider: 'local-llm',
                    modelName: settings.localModelName,
                    latencyMs: Date.now() - startTime,
                };
            } catch (err: any) {
                // Fallback sang offline
                return {
                    answer: `**[Lỗi Local LLM (${settings.localLlmEndpoint})]:** ${err?.message || 'Không thể kết nối'}.\n\n${this.offlineRuleBasedAnswer(question, context)}`,
                    provider: 'offline-rules',
                    latencyMs: Date.now() - startTime,
                };
            }
        }

        // 2. Chế độ 'auto' hoặc 'gemini': Thử gọi Gemini qua Backend trước nếu có ấn bản trên hệ thống
        const numericEdId = Number(context.editionId);
        if ((settings.providerMode === 'auto' || settings.providerMode === 'gemini') && numericEdId > 0) {
            try {
                const data = await requestApi<{ answer?: string }>(
                    `/EbookEditions/${numericEdId}/ask-copilot`,
                    {
                        method: 'POST',
                        body: JSON.stringify({
                            question,
                            currentPage: context.currentPage,
                            selectedText: context.selectedText,
                        }),
                    }
                );

                if (data?.answer && !data.answer.includes('quá tải') && !data.answer.includes('error')) {
                    return {
                        answer: data.answer,
                        provider: 'gemini',
                        modelName: 'Gemini (Backend)',
                        latencyMs: Date.now() - startTime,
                    };
                }
            } catch (backendErr: any) {
                console.warn('[Gemini Backend Unreachable/Failed]', backendErr?.message);
                // Nếu người dùng chọn 'gemini' độc quyền thì ném lỗi
                if (settings.providerMode === 'gemini') {
                    return {
                        answer: `Không thể kết nối với dịch vụ Gemini: ${backendErr?.message || 'Máy chủ bận'}. Vui lòng thử lại hoặc bật chế độ Local LLM trong phần Cài đặt AI.`,
                        provider: 'gemini',
                        latencyMs: Date.now() - startTime,
                    };
                }
            }
        }

        // 3. Fallback sang Local LLM (chế độ 'auto' khi Gemini thất bại)
        try {
            const localAnswer = await this.queryLocalLlm(question, context, settings);
            return {
                answer: `${localAnswer}\n\n*(Đã tự động chuyển đổi sang Local LLM: ${settings.localModelName})*`,
                provider: 'local-llm',
                modelName: settings.localModelName,
                latencyMs: Date.now() - startTime,
            };
        } catch (localErr: any) {
            console.warn('[Local LLM Fallback Failed]', localErr?.message);
        }

        // 4. Fallback cuối cùng: Trợ lý phân tích văn bản cục bộ ngoại tuyến
        const offlineAns = this.offlineRuleBasedAnswer(question, context);
        return {
            answer: `${offlineAns}\n\n*(Đang phản hồi ở chế độ Trợ lý Ngoại tuyến do Gemini & Local LLM chưa sẵn sàng)*`,
            provider: 'offline-rules',
            latencyMs: Date.now() - startTime,
        };
    },
};

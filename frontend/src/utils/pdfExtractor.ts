// ============================================================================
// BỘ BÓC TÁCH VĂN BẢN & XỬ LÝ TỆP PDF THUẦN TYPESCRIPT (ZERO DEPENDENCY)
// Bóc tách text stream (FlateDecode) trong trình duyệt bằng DecompressionStream,
// hỗ trợ chuyển đổi PDF sang dạng trang text thuần để TTS và hỏi đáp AI.
// ============================================================================

export interface PdfExtractedPage {
    pageNumber: number;
    paragraphs: string[];
    rawText: string;
}

export interface PdfExtractionResult {
    title: string;
    totalPages: number;
    pages: PdfExtractedPage[];
    blobUrl: string;
}

/**
 * Giải nén zlib deflate stream (RFC 1950) bằng DecompressionStream
 */
async function decompressDeflate(data: Uint8Array): Promise<Uint8Array> {
    if (typeof DecompressionStream === 'undefined') {
        throw new Error('DecompressionStream không được hỗ trợ trên trình duyệt này.');
    }
    // Chế độ 'deflate' hỗ trợ chuẩn zlib header (78 9c...)
    const ds = new DecompressionStream('deflate');
    const writer = ds.writable.getWriter();
    writer.write(data as any);
    writer.close();

    const reader = ds.readable.getReader();
    const chunks: Uint8Array[] = [];
    let totalLen = 0;
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
            chunks.push(value);
            totalLen += value.length;
        }
    }
    const out = new Uint8Array(totalLen);
    let offset = 0;
    for (const chunk of chunks) {
        out.set(chunk, offset);
        offset += chunk.length;
    }
    return out;
}

/**
 * Bóc tách chuỗi văn bản từ nội dung lệnh PostScript / PDF (Tj, TJ, ', ")
 */
function extractTextFromPdfStream(content: string): string {
    const textPieces: string[] = [];

    // Tìm tất cả khối BT (Begin Text) ... ET (End Text)
    const btRegex = /BT([\s\S]*?)ET/g;
    let btMatch: RegExpExecArray | null;

    while ((btMatch = btRegex.exec(content)) !== null) {
        const block = btMatch[1];

        // 1. Dạng array TJ: [(Chuoi 1) 20 (Chuoi 2)] TJ
        const tjArrayRegex = /\[((?:[^\]\\]|\\.)*)\]\s*TJ/g;
        let arrayMatch: RegExpExecArray | null;
        while ((arrayMatch = tjArrayRegex.exec(block)) !== null) {
            const inner = arrayMatch[1];
            const strRegex = /\(((?:[^)\\]|\\.)*)\)/g;
            let strMatch: RegExpExecArray | null;
            let line = '';
            while ((strMatch = strRegex.exec(inner)) !== null) {
                line += decodePdfString(strMatch[1]);
            }
            if (line.trim()) textPieces.push(line.trim());
        }

        // 2. Dạng đơn Tj: (Chuoi) Tj
        const singleTjRegex = /\(((?:[^)\\]|\\.)*)\)\s*(?:Tj|'|")/g;
        let singleMatch: RegExpExecArray | null;
        while ((singleMatch = singleTjRegex.exec(block)) !== null) {
            const decoded = decodePdfString(singleMatch[1]);
            if (decoded.trim()) textPieces.push(decoded.trim());
        }
    }

    // Nếu không tìm thấy qua BT/ET (dạng thô), thử trích xuất các chuỗi trong ngoặc đơn
    if (textPieces.length === 0) {
        const fallbackRegex = /\(((?:[^)\\]|\\.)*)\)/g;
        let m: RegExpExecArray | null;
        while ((m = fallbackRegex.exec(content)) !== null) {
            const cleaned = decodePdfString(m[1]).trim();
            if (cleaned.length > 2 && !/^[0-9a-fA-F\s]+$/.test(cleaned)) {
                textPieces.push(cleaned);
            }
        }
    }

    return textPieces.join(' ');
}

/**
 * Giải mã chuỗi escape chuẩn PDF: \n, \r, \t, \(, \), \\, \ddd (octal)
 */
function decodePdfString(str: string): string {
    return str
        .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\b/g, '\b')
        .replace(/\\f/g, '\f')
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')')
        .replace(/\\\\/g, '\\');
}

/**
 * Phân tích và trích xuất text từ mảng byte PDF
 */
export async function extractPdf(buffer: ArrayBuffer, fileName: string = 'Tài liệu PDF'): Promise<PdfExtractionResult> {
    const blob = new Blob([buffer], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);
    const bytes = new Uint8Array(buffer);
    const textDec = new TextDecoder('latin1'); // Đọc dạng byte an toàn
    const rawPdf = textDec.decode(bytes);

    // Tìm các stream trong PDF
    const streamRegex = /stream[\r\n]+([\s\S]*?)endstream/g;
    let match: RegExpExecArray | null;
    const extractedPages: PdfExtractedPage[] = [];
    let pageNum = 1;

    while ((match = streamRegex.exec(rawPdf)) !== null) {
        const streamStart = match.index + match[0].indexOf('stream') + 6;
        // Bỏ qua CR/LF sau 'stream'
        let actualStart = streamStart;
        if (bytes[actualStart] === 13) actualStart++;
        if (bytes[actualStart] === 10) actualStart++;

        const streamEnd = match.index + match[0].lastIndexOf('endstream');
        if (streamEnd <= actualStart) continue;

        const streamBytes = bytes.subarray(actualStart, streamEnd);
        let decompressedText = '';

        // Kiểm tra xem stream có bị nén FlateDecode (zlib header 0x78) hay không
        if (streamBytes.length > 2 && streamBytes[0] === 0x78) {
            try {
                const uncompressed = await decompressDeflate(streamBytes);
                const utf8Dec = new TextDecoder('utf-8');
                decompressedText = utf8Dec.decode(uncompressed);
            } catch {
                try {
                    // Thử decode thô nếu không nén
                    decompressedText = textDec.decode(streamBytes);
                } catch {
                    continue;
                }
            }
        } else {
            decompressedText = textDec.decode(streamBytes);
        }

        const pageText = extractTextFromPdfStream(decompressedText);
        if (pageText.length > 30) {
            const paragraphs = pageText
                .split(/\.\s+|\n+/)
                .map((p) => p.trim())
                .filter((p) => p.length > 0);

            extractedPages.push({
                pageNumber: pageNum++,
                paragraphs: paragraphs.length > 0 ? paragraphs : [pageText],
                rawText: pageText,
            });
        }
    }

    // Nếu không trích xuất được text tự động (ví dụ file Scan thuần ảnh hoặc font tùy chỉnh),
    // tạo trang mẫu để hiển thị thông báo chuyển hướng sang chế độ Native PDF
    if (extractedPages.length === 0) {
        // Đếm số trang sơ bộ qua /Type /Page
        const pageMatches = rawPdf.match(/\/Type\s*\/Page\b/g);
        const estPages = pageMatches ? pageMatches.length : 1;

        for (let i = 1; i <= Math.min(estPages, 50); i++) {
            extractedPages.push({
                pageNumber: i,
                paragraphs: [
                    `Trang PDF #${i}: Tài liệu chứa trang scan đồ họa hoặc font nhúng mã hóa.`,
                    'Bạn có thể chuyển sang chế độ "Xem PDF Gốc" trên thanh công cụ để đọc trực quan đầy đủ hình ảnh và định dạng nguyên bản.',
                ],
                rawText: `Trang PDF #${i}: Bạn có thể chuyển sang chế độ "Xem PDF Gốc" để đọc trang này.`,
            });
        }
    }

    return {
        title: fileName.replace(/\.[^/.]+$/, ''),
        totalPages: extractedPages.length,
        pages: extractedPages,
        blobUrl,
    };
}

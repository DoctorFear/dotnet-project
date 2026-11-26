// ============================================================================
// BỘ BÓC TÁCH & ĐỌC ĐỊNH DẠNG EPUB THUẦN TYPESCRIPT (ZERO DEPENDENCY)
// Hỗ trợ giải nén tệp ZIP trực tiếp trong trình duyệt qua DecompressionStream,
// đọc cấu trúc OPF, Spine, NCX/Nav và chia trang hiển thị.
// ============================================================================

export interface EpubChapter {
    id: string;
    title: string;
    href: string;
    htmlContent: string;
    textContent: string;
}

export interface EpubBook {
    title: string;
    author: string;
    description?: string;
    language?: string;
    coverImageUrl?: string;
    chapters: EpubChapter[];
    pages: EpubPage[];
    toc: { title: string; href: string; pageIndex: number }[];
}

export interface EpubPage {
    pageNumber: number;
    chapterTitle: string;
    paragraphs: string[];
    rawText: string;
}

/**
 * Giải nén mảng byte nén Deflate (deflate-raw RFC 1951) bằng DecompressionStream của trình duyệt
 */
async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
    if (typeof DecompressionStream === 'undefined') {
        throw new Error('Trình duyệt của bạn không hỗ trợ DecompressionStream.');
    }
    const ds = new DecompressionStream('deflate-raw');
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
 * Trình bóc tách tệp ZIP chuẩn thuần JavaScript từ ArrayBuffer
 */
async function readZipEntries(buffer: ArrayBuffer): Promise<Map<string, Uint8Array>> {
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    const fileMap = new Map<string, Uint8Array>();

    // 1. Tìm End of Central Directory (EOCD) signature 0x06054b50 từ cuối file lên
    let eocdOffset = -1;
    const maxSearch = Math.min(buffer.byteLength, 65536 + 22);
    for (let i = buffer.byteLength - 22; i >= buffer.byteLength - maxSearch; i--) {
        if (view.getUint32(i, true) === 0x06054b50) {
            eocdOffset = i;
            break;
        }
    }

    if (eocdOffset === -1) {
        // Fallback: Duyệt tuần tự qua Local File Headers 0x04034b50
        let ptr = 0;
        const textDec = new TextDecoder('utf-8');
        while (ptr < buffer.byteLength - 30) {
            if (view.getUint32(ptr, true) !== 0x04034b50) break;
            const method = view.getUint16(ptr + 8, true);
            const compSize = view.getUint32(ptr + 18, true);
            const fnLen = view.getUint16(ptr + 26, true);
            const extraLen = view.getUint16(ptr + 28, true);
            const filename = textDec.decode(bytes.subarray(ptr + 30, ptr + 30 + fnLen));
            const dataStart = ptr + 30 + fnLen + extraLen;

            if (compSize > 0 && dataStart + compSize <= buffer.byteLength) {
                const compData = bytes.subarray(dataStart, dataStart + compSize);
                if (method === 0) {
                    fileMap.set(filename, compData);
                } else if (method === 8) {
                    try {
                        const inflated = await inflateRaw(compData);
                        fileMap.set(filename, inflated);
                    } catch {
                        // Bỏ qua nếu lỗi block
                    }
                }
                ptr = dataStart + compSize;
            } else {
                ptr += 30 + fnLen + extraLen;
            }
        }
        return fileMap;
    }

    const totalRecords = view.getUint16(eocdOffset + 10, true);
    const cdOffset = view.getUint32(eocdOffset + 16, true);

    let cdPtr = cdOffset;
    const textDec = new TextDecoder('utf-8');

    for (let i = 0; i < totalRecords; i++) {
        if (cdPtr >= eocdOffset) break;
        if (view.getUint32(cdPtr, true) !== 0x02014b50) break;

        const method = view.getUint16(cdPtr + 10, true);
        const compSize = view.getUint32(cdPtr + 20, true);
        const uncompSize = view.getUint32(cdPtr + 24, true);
        const fnLen = view.getUint16(cdPtr + 28, true);
        const extraLen = view.getUint16(cdPtr + 30, true);
        const commentLen = view.getUint16(cdPtr + 32, true);
        const localHeaderOffset = view.getUint32(cdPtr + 42, true);

        const filename = textDec.decode(bytes.subarray(cdPtr + 46, cdPtr + 46 + fnLen));
        cdPtr += 46 + fnLen + extraLen + commentLen;

        // Bỏ qua thư mục
        if (filename.endsWith('/')) continue;

        // Đọc data từ local header
        if (localHeaderOffset + 30 <= buffer.byteLength) {
            const locFnLen = view.getUint16(localHeaderOffset + 26, true);
            const locExtraLen = view.getUint16(localHeaderOffset + 28, true);
            const dataStart = localHeaderOffset + 30 + locFnLen + locExtraLen;

            if (dataStart + compSize <= buffer.byteLength) {
                const compData = bytes.subarray(dataStart, dataStart + compSize);
                if (method === 0) {
                    fileMap.set(filename, compData);
                } else if (method === 8) {
                    try {
                        const inflated = await inflateRaw(compData);
                        fileMap.set(filename, inflated);
                    } catch (e) {
                        console.warn(`[EPUB Parser] Lỗi giải nén ${filename}:`, e);
                    }
                } else if (uncompSize === 0) {
                    fileMap.set(filename, new Uint8Array(0));
                }
            }
        }
    }

    return fileMap;
}

/**
 * Giải quyết đường dẫn tương đối trong thư mục EPUB
 */
function resolvePath(basePath: string, relativePath: string): string {
    const parts = basePath.split('/');
    parts.pop(); // bỏ tên file hiện tại
    const relParts = relativePath.split('/');

    for (const part of relParts) {
        if (part === '.' || part === '') continue;
        if (part === '..') parts.pop();
        else parts.push(part);
    }
    return parts.join('/');
}

/**
 * Phân tích tệp EPUB từ ArrayBuffer
 */
export async function parseEpub(buffer: ArrayBuffer): Promise<EpubBook> {
    const files = await readZipEntries(buffer);
    const textDec = new TextDecoder('utf-8');

    // 1. Tìm container.xml
    const containerEntry = files.get('META-INF/container.xml');
    if (!containerEntry) {
        throw new Error('Tệp không đúng định dạng EPUB (thiếu META-INF/container.xml).');
    }
    const containerXml = textDec.decode(containerEntry);
    const domParser = new DOMParser();
    const containerDoc = domParser.parseFromString(containerXml, 'application/xml');

    const rootfileEl = containerDoc.querySelector('rootfile');
    const opfPath = rootfileEl?.getAttribute('full-path');
    if (!opfPath) {
        throw new Error('Không tìm thấy đường dẫn tệp OPF trong container.xml.');
    }

    // 2. Đọc file OPF
    const opfEntry = files.get(opfPath);
    if (!opfEntry) {
        throw new Error(`Không tìm thấy tệp OPF tại đường dẫn: ${opfPath}`);
    }
    const opfXml = textDec.decode(opfEntry);
    const opfDoc = domParser.parseFromString(opfXml, 'application/xml');

    // Metadata
    const title = opfDoc.querySelector('title')?.textContent?.trim() || 'Sách EPUB không tên';
    const author = opfDoc.querySelector('creator')?.textContent?.trim() || 'Tác giả chưa xác định';
    const description = opfDoc.querySelector('description')?.textContent?.trim();
    const language = opfDoc.querySelector('language')?.textContent?.trim() || 'vi';

    // Manifest: map id -> href
    const manifest = new Map<string, { href: string; mediaType: string }>();
    const itemElements = opfDoc.querySelectorAll('manifest > item');
    itemElements.forEach((item) => {
        const id = item.getAttribute('id');
        const href = item.getAttribute('href');
        const mediaType = item.getAttribute('media-type') || '';
        if (id && href) {
            manifest.set(id, { href, mediaType });
        }
    });

    // Spine: thứ tự đọc
    const spineRefs: string[] = [];
    const itemrefElements = opfDoc.querySelectorAll('spine > itemref');
    itemrefElements.forEach((ref) => {
        const idref = ref.getAttribute('idref');
        if (idref) spineRefs.push(idref);
    });

    // 3. Đọc từng chương sách
    const chapters: EpubChapter[] = [];
    for (let i = 0; i < spineRefs.length; i++) {
        const idref = spineRefs[i];
        const item = manifest.get(idref);
        if (!item) continue;

        const resolvedHref = resolvePath(opfPath, item.href);
        const chapterEntry = files.get(resolvedHref) || files.get(item.href);

        if (!chapterEntry) continue;

        const htmlStr = textDec.decode(chapterEntry);
        const chapterDoc = domParser.parseFromString(htmlStr, 'text/html');

        // Lấy tiêu đề chương từ heading hoặc title
        const headingEl = chapterDoc.querySelector('h1, h2, h3, title');
        const chapterTitle = headingEl?.textContent?.trim() || `Chương ${i + 1}`;

        // Lấy text thuần
        const bodyEl = chapterDoc.body || chapterDoc.documentElement;
        const textContent = bodyEl?.innerText || bodyEl?.textContent || '';

        chapters.push({
            id: idref,
            title: chapterTitle,
            href: item.href,
            htmlContent: bodyEl?.innerHTML || htmlStr,
            textContent: textContent.trim(),
        });
    }

    // 4. Chuyển đổi thành các trang đọc (mỗi trang ~800-1100 ký tự theo đoạn văn để hiển thị spread)
    const pages: EpubPage[] = [];
    let pageCounter = 1;
    const toc: { title: string; href: string; pageIndex: number }[] = [];

    for (const chapter of chapters) {
        if (!chapter.textContent) continue;

        toc.push({
            title: chapter.title,
            href: chapter.href,
            pageIndex: pageCounter,
        });

        // Tách theo đoạn văn
        const rawParas = chapter.textContent
            .split(/\n\s*\n|\r\n\s*\r\n/)
            .map((p) => p.trim())
            .filter((p) => p.length > 0);

        if (rawParas.length === 0) {
            pages.push({
                pageNumber: pageCounter++,
                chapterTitle: chapter.title,
                paragraphs: [chapter.textContent],
                rawText: chapter.textContent,
            });
            continue;
        }

        let currentBatch: string[] = [];
        let currentLen = 0;

        for (const para of rawParas) {
            currentBatch.push(para);
            currentLen += para.length;

            if (currentLen >= 900) {
                pages.push({
                    pageNumber: pageCounter++,
                    chapterTitle: chapter.title,
                    paragraphs: [...currentBatch],
                    rawText: currentBatch.join('\n\n'),
                });
                currentBatch = [];
                currentLen = 0;
            }
        }

        if (currentBatch.length > 0) {
            pages.push({
                pageNumber: pageCounter++,
                chapterTitle: chapter.title,
                paragraphs: [...currentBatch],
                rawText: currentBatch.join('\n\n'),
            });
        }
    }

    return {
        title,
        author,
        description,
        language,
        chapters,
        pages: pages.length > 0 ? pages : [
            {
                pageNumber: 1,
                chapterTitle: title,
                paragraphs: [description || 'Nội dung sách đang tải...'],
                rawText: description || '',
            },
        ],
        toc,
    };
}

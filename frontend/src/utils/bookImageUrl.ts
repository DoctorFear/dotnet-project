// Chuẩn hóa cả liên kết Dropbox cũ bị nối thêm dấu hỏi vào cuối query.
export function normalizeBookImageUrl(src?: string): string | undefined {
    if (!src) return src;
    try {
        const url = new URL(src);
        if (!['www.dropbox.com', 'dropbox.com'].includes(url.hostname)) return src;
        url.search = url.search.replace(/\?raw=1(?=&|$)/g, '&raw=1');
        url.searchParams.delete('dl');
        url.searchParams.set('raw', '1');
        return url.toString();
    } catch {
        return src;
    }
}

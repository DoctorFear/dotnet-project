// Chuẩn hóa chuỗi tiếng Việt về dạng không dấu, viết thường và cắt khoảng trắng thừa
export const normalizeVietnamese = (value: string): string => {
    return value
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'd')
        .toLowerCase();
};

// Kiểm tra từ khóa đã chuẩn hóa có xuất hiện trong ít nhất một trường dữ liệu hay không
export const matchesVietnameseSearch = (
    keyword: string,
    ...fields: Array<string | null | undefined>
): boolean => {
    const normalizedKeyword = normalizeVietnamese(keyword);

    if (!normalizedKeyword) {
        return true;
    }

    return fields.some((field) => {
        if (!field) {
            return false;
        }

        return normalizeVietnamese(field).includes(normalizedKeyword);
    });
};

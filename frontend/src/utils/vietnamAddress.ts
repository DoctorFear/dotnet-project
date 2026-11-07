const API_BASE_URL = 'https://vietnam-address.roooming.io.vn';

// Tỉnh/Thành phố mặc định duy nhất: Thành phố Hồ Chí Minh (ID 29 trên API roooming)
export const DEFAULT_PROVINCE_NAME = 'Thành phố Hồ Chí Minh';
const HCM_PROVINCE_ID = '29';

// Danh sách dự phòng khi mạng offline
export const FALLBACK_HCM_WARDS: string[] = [
    'Phường Bến Nghé (Quận 1)',
    'Phường Bến Thành (Quận 1)',
    'Phường Tân Định (Quận 1)',
    'Phường Đa Kao (Quận 1)',
    'Phường Cầu Ông Lãnh (Quận 1)',
    'Phường Võ Thị Sáu (Quận 3)',
    'Phường 1 (Quận 3)',
    'Phường 4 (Quận 3)',
    'Phường 9 (Quận 3)',
    'Phường 1 (Quận 5)',
    'Phường 2 (Quận 5)',
    'Phường 4 (Quận 5)',
    'Phường 5 (Quận 5)',
    'Phường An Khánh (TP. Thủ Đức)',
    'Phường Thảo Điền (TP. Thủ Đức)'
];

let cachedHcmWards: string[] | null = null;

/**
 * Lấy toàn bộ danh sách Phường/Xã tại TP. Hồ Chí Minh trực tiếp từ API https://vietnam-address.roooming.io.vn/api/provinces/29/wards
 */
export async function getHcmWardsFromApi(): Promise<string[]> {
    if (cachedHcmWards && cachedHcmWards.length > 0) {
        return cachedHcmWards;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/api/provinces/${HCM_PROVINCE_ID}/wards`);
        if (!res.ok) throw new Error('API Error');

        const json = await res.json();
        const list = Array.isArray(json) ? json : (json.data || json.wards || []);

        if (Array.isArray(list) && list.length > 0) {
            const wardNames = list.map((w: any) => String(w.name || w.wardName));
            cachedHcmWards = wardNames;
            return wardNames;
        }
        throw new Error('Empty wards');
    } catch {
        return FALLBACK_HCM_WARDS;
    }
}

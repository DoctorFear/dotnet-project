const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

interface ApiErrorBody {
    success?: boolean;
    message?: string;
    title?: string;
    errors?: Record<string, string[]>;
}

const getAccessToken = () => localStorage.getItem('accessToken');

export const requestApi = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
    const headers = new Headers(options.headers);
    headers.set('Accept', 'application/json');

    if (options.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    const token = getAccessToken();
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers });
    if (response.ok) {
        return response.status === 204 ? (undefined as T) : (response.json() as Promise<T>);
    }

    const body = (await response.json().catch(() => ({}))) as ApiErrorBody;

    if (response.status === 401) {
        throw new Error('Phiên làm việc đã hết hạn hoặc bạn chưa đăng nhập.');
    }

    // Ưu tiên đọc message từ ApiResponse.Fail(message) của Backend
    if (body.message) {
        throw new Error(body.message);
    }

    // Đọc ModelState validation errors nếu có
    if (body.errors) {
        const firstErrorKey = Object.keys(body.errors)[0];
        if (firstErrorKey && body.errors[firstErrorKey].length > 0) {
            throw new Error(body.errors[firstErrorKey][0]);
        }
    }

    throw new Error(body.title || 'Không thể kết nối đến hệ thống.');
};
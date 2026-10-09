const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

interface ApiErrorBody {
    message?: string;
    title?: string;
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
        return response.status === 204 ? (undefined as T) : response.json() as Promise<T>;
    }

    const body = await response.json().catch(() => ({})) as ApiErrorBody;
    if (response.status === 401) {
        throw new Error('Bạn cần đăng nhập bằng tài khoản Admin hoặc Staff để thực hiện thao tác này.');
    }

    throw new Error(body.message || body.title || 'Không thể kết nối đến hệ thống.');
};

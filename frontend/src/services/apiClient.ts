const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

interface ApiErrorBody {
    success?: boolean;
    message?: string;
    title?: string;
    errors?: Record<string, string[]>;
}

const getAccessToken = () => localStorage.getItem('accessToken');
const getRefreshToken = () => localStorage.getItem('refreshToken');

const clearAuthAndRedirect = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    if (window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
};

let refreshPromise: Promise<string | null> | null = null;

const tryRefreshToken = async (): Promise<string | null> => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        clearAuthAndRedirect();
        return null;
    }

    if (!refreshPromise) {
        refreshPromise = (async () => {
            try {
                const res = await fetch(`${apiBaseUrl}/Auth/refresh-token`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ refreshToken }),
                });

                if (!res.ok) {
                    clearAuthAndRedirect();
                    return null;
                }

                const json = await res.json();
                if (json.success && json.data?.accessToken) {
                    localStorage.setItem('accessToken', json.data.accessToken);
                    if (json.data.refreshToken) {
                        localStorage.setItem('refreshToken', json.data.refreshToken);
                    }
                    return json.data.accessToken as string;
                } else {
                    clearAuthAndRedirect();
                    return null;
                }
            } catch {
                clearAuthAndRedirect();
                return null;
            } finally {
                refreshPromise = null;
            }
        })();
    }

    return refreshPromise;
};

const sendRequest = async (path: string, options: RequestInit = {}): Promise<Response> => {
    const headers = new Headers(options.headers);
    if (!headers.has('Accept')) headers.set('Accept', 'application/json');

    if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    const token = getAccessToken();
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    let response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers });

    // Khi nhận response 401, thử refresh token nếu không phải request login hoặc refresh-token
    if (response.status === 401 && !path.toLowerCase().includes('/auth/login') && !path.toLowerCase().includes('/auth/refresh-token')) {
        const newAccessToken = await tryRefreshToken();
        if (newAccessToken) {
            headers.set('Authorization', `Bearer ${newAccessToken}`);
            response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers });
        } else {
            throw new Error('Phiên làm việc đã hết hạn hoặc bạn chưa đăng nhập.');
        }
    }

    if (response.ok) {
        return response;
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

export const requestApi = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
    const response = await sendRequest(path, options);
    return response.status === 204 ? undefined as T : response.json() as Promise<T>;
};

export const requestBlob = async (path: string, options: RequestInit = {}): Promise<Blob> => (await sendRequest(path, options)).blob();
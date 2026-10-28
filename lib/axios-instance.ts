import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

// Orval-generated endpoints already include /api, so baseURL must stay at host root.
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_HOST || 'http://localhost:3000';
const baseURL = rawApiUrl.replace(/\/+$/, '').replace(/\/api$/, '');

const axiosInstance = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to attach JWT token
axiosInstance.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('auth_token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// A separate client prevents refresh failures from recursively refreshing.
const refreshClient = axios.create({ baseURL });
let refreshInFlight: Promise<string> | null = null;
type RetryConfig = InternalAxiosRequestConfig & { authRetried?: boolean };

function expireSession(error: AxiosError, expectedToken: string | null) {
    // A late response must not clear a newer login.
    if (localStorage.getItem('auth_token') === expectedToken) {
        for (const key of ['auth_token', 'refresh_token', 'booth_id', 'user_role']) localStorage.removeItem(key);
    }
    if (error.response) {
        error.response.data = { message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại rồi thử lại thao tác.' };
    }
    return error;
}

function refreshAccessToken() {
    if (!refreshInFlight) {
        const refreshToken = localStorage.getItem('refresh_token');
        refreshInFlight = refreshClient.post('/api/auth/refresh', { refreshToken })
            .then(response => {
                const tokens = response.data?.data;
                if (!tokens?.accessToken || !tokens?.refreshToken) throw new Error('Không nhận được token làm mới phiên');
                if (localStorage.getItem('refresh_token') !== refreshToken) throw new Error('Phiên đăng nhập đã thay đổi. Vui lòng thử lại.');
                localStorage.setItem('auth_token', tokens.accessToken);
                localStorage.setItem('refresh_token', tokens.refreshToken);
                return tokens.accessToken as string;
            })
            .finally(() => { refreshInFlight = null; });
    }
    return refreshInFlight;
}

axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error: AxiosError) => {
        const config = error.config as RetryConfig | undefined;
        if (error.response?.status !== 401 || typeof window === 'undefined' || !config ||
            /\/auth\/(login|register|refresh)(?:[/?]|$)/.test(config.url ?? '')) throw error;

        const failedToken = String(config.headers.Authorization ?? '').replace(/^Bearer\s+/i, '') || null;
        const currentToken = localStorage.getItem('auth_token');
        if (config.authRetried) throw expireSession(error, failedToken);
        config.authRetried = true;

        // Another request may already have completed the refresh.
        if (currentToken && currentToken !== failedToken) {
            config.headers.Authorization = `Bearer ${currentToken}`;
            return axiosInstance(config);
        }
        if (!localStorage.getItem('refresh_token')) throw expireSession(error, failedToken);
        let token: string;
        try {
            token = await refreshAccessToken();
        } catch (refreshError) {
            if (axios.isAxiosError(refreshError) && [401, 403].includes(refreshError.response?.status ?? 0)) {
                throw expireSession(error, failedToken);
            }
            // Network/server failures are recoverable: retain the session and form.
            throw refreshError;
        }
        config.headers.Authorization = `Bearer ${token}`;
        return axiosInstance(config);
    }
);

/**
 * Custom axios instance wrapper for Orval
 * Orval generates fetch-style options: { method, body, headers }
 * We map these to Axios config and return response.data (unwrapped).
 */
export const customAxiosInstance = async <T>(
    config: AxiosRequestConfig | string,
    options?: any
): Promise<T> => {
    const source = axios.CancelToken.source();

    let axiosConfig: AxiosRequestConfig;
    if (typeof config === 'string') {
        // Orval passes URL as string + fetch-style options
        axiosConfig = {
            url: config,
            method: options?.method || 'GET',
            // Orval serializes body as JSON string
            data: options?.body ? JSON.parse(options.body) : undefined,
            headers: options?.headers,
        };
    } else {
        axiosConfig = {
            ...config,
            ...options,
        };
    }

    const promise = axiosInstance({
        ...axiosConfig,
        cancelToken: source.token,
    }).then((response) => response.data);

    // Add cancel method required by react-query abort functionality
    // @ts-expect-error adding property to promise
    promise.cancel = () => {
        source.cancel('Query was cancelled by React Query');
    };

    return promise as unknown as Promise<T>;
};

export default axiosInstance;

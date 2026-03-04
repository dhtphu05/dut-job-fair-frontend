import axios, { AxiosError, AxiosRequestConfig } from 'axios';

// Get API host from env, default to local backend
const baseURL = process.env.NEXT_PUBLIC_API_HOST || 'http://localhost:3000';

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

// Response interceptor to handle errors (e.g., global 401 redirect)
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error: AxiosError) => {
        // Basic 401 handling
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('auth_token');
                // Let the app handle the redirect logic (e.g. by wrapping components or triggering state changes)
                // window.location.href = '/login'; 
            }
        }
        return Promise.reject(error);
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

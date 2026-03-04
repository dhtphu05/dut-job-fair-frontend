import axios, { AxiosError, AxiosRequestConfig } from 'axios';

// Get API URL from env, default to local backend
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

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
 */
export const customAxiosInstance = async <T>(
    config: AxiosRequestConfig,
    options?: AxiosRequestConfig
): Promise<T> => {
    const source = axios.CancelToken.source();

    const promise = axiosInstance({
        ...config,
        ...options,
        cancelToken: source.token,
    }).then(({ data }) => data);

    // Add cancel method required by react-query abort functionality
    // @ts-expect-error adding property to promise
    promise.cancel = () => {
        source.cancel('Query was cancelled by React Query');
    };

    return promise;
};

export default axiosInstance;

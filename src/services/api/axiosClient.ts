import axios from 'axios';

const baseURL = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const axiosClient = axios.create({
  baseURL,
  // Default timeout for regular API calls. Axios has no timeout at all by
  // default, so a stuck request would otherwise hang the UI forever with no
  // feedback. Long-running calls (e.g. AI evaluation) override this per-request.
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add a request interceptor to append JWT token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Queues requests that hit a 401 while a token refresh is already in flight,
// so we only call /auth/refresh once instead of once per parallel request.
let isRefreshing = false;
let pendingQueue: { resolve: (token: string) => void; reject: (error: unknown) => void }[] = [];

function flushQueue(error: unknown, token: string | null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error || !token) reject(error);
    else resolve(token);
  });
  pendingQueue = [];
}

function forceLogout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  // App.tsx only checks localStorage for a token on mount, so a full reload
  // is the simplest way to drop the user back to the login screen.
  window.location.reload();
}

// Add a response interceptor to handle errors globally
axiosClient.interceptors.response.use(
  (response) => {
    return response.data; // Since our BE wraps response in ApiResponse, we return data directly
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const requestUrl: string = originalRequest?.url || '';
    const isAuthEndpoint = requestUrl.includes('/auth/');

    if (status !== 401 || isAuthEndpoint || originalRequest._retry) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      forceLogout();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((newToken) => {
        originalRequest._retry = true;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const res = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
      const newAccessToken: string = res.data.data.accessToken;
      const newRefreshToken: string = res.data.data.refreshToken;

      localStorage.setItem('accessToken', newAccessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      flushQueue(null, newAccessToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return axiosClient(originalRequest);
    } catch (refreshError) {
      flushQueue(refreshError, null);
      forceLogout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosClient;

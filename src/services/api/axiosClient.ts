import axios from 'axios';

const axiosClient = axios.create({
  baseURL: (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:8080/api',
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

// Add a response interceptor to handle errors globally
axiosClient.interceptors.response.use(
  (response) => {
    return response.data; // Since our BE wraps response in ApiResponse, we return data directly
  },
  (error) => {
    // Handle global errors, e.g., 401 Unauthorized (Token expired)
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized. Please login again.");
      // Optional: Dispatch logout event or redirect to login
    }
    return Promise.reject(error);
  }
);

export default axiosClient;

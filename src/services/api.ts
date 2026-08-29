import axios, { type AxiosError } from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://akulas-backend.onrender.com/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Removed request interceptor that adds JWT token from localStorage

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Unauthorized - dispatch event to AuthContext
      window.dispatchEvent(new Event('auth:unauthorized'));
    } else if (error.response?.status === 403) {
      // Forbidden - access denied
      alert('Bu işlem için yetkiniz bulunmamaktadır.');
      window.dispatchEvent(new Event('auth:forbidden'));
    }
    return Promise.reject(error);
  }
);

export default apiClient;

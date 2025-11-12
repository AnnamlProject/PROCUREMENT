import axios, { AxiosError } from 'axios';
import { ApiError } from './types/core';

const api = axios.create({
  // FIX: Cast `import.meta` to `any` to access `env` property in a Vite project without custom type declarations.
  baseURL: (import.meta as any).env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the auth token
api.interceptors.request.use(
  (config) => {
    // In a real app, you would get the token from a state management library or localStorage
    const token = 'dummy-jwt-token';
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to normalize errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    let apiError: ApiError = {
      message: 'Terjadi kesalahan yang tidak diketahui.',
    };

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const errorData = error.response.data as any;
      apiError = {
        message: errorData.message || error.message,
        fieldErrors: errorData.errors || errorData.fieldErrors,
      };
    } else if (error.request) {
      // The request was made but no response was received
      apiError.message = 'Tidak ada respons dari server. Periksa koneksi internet Anda.';
    } else {
      // Something happened in setting up the request that triggered an Error
      apiError.message = error.message;
    }

    return Promise.reject(apiError);
  },
);

export default api;

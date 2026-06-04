import axios, { AxiosInstance } from 'axios';

/**
 * Creates a configured Axios instance with base URL and interceptors.
 * @param baseUrl The base URL for the API.
 * @returns AxiosInstance
 */
const createAxiosInstance = (baseUrl: string): AxiosInstance => {
  const instance = axios.create({
    baseURL: baseUrl,
  });

  // Request interceptor for auth tokens
  instance.interceptors.request.use(
    (config) => {
      // In a real app, you might get the token from a state management store or cookie
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Handle unauthorized error (e.g., redirect to login)
        // localStorage.removeItem('token');
        // window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

export default createAxiosInstance;

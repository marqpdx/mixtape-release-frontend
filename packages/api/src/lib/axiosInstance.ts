// packages/api/src/lib/axiosInstance.ts

import { getAccessToken, setAccessToken, clearAccessToken } from "@mixtape/auth/tokenStorage";
import { refreshAccessToken } from "../clients/auth/api";
import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";

// Get API URL from environment or default
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Browser environment - use Next.js env var
    return process.env.NEXT_PUBLIC_ROOT_API_URL;
  }
  // Server environment - could use different env var if needed
  return process.env.NEXT_PUBLIC_ROOT_API_URL || 'http://127.0.0.1:8010';
};

export const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor to include the access token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = getAccessToken();

    // Make sure headers exists
    config.headers = config.headers || {};

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    } else {
      // Remove any stale Authorization header
      if ("Authorization" in config.headers) {
        delete (config.headers as any)["Authorization"];
      }
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for auto-refresh and error handling
axiosInstance.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  async (error: AxiosError): Promise<AxiosResponse | void> => {
    // Extract Django error messages for better UX
    if (error.response?.data) {
      const data = error.response.data as any;
      // Try to extract meaningful error message from Django response
      const extractedMessage =
        data.detail ||
        data.error ||
        (typeof data === 'object' && !Array.isArray(data)
          ? Object.entries(data)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
              .join('; ')
          : null);

      if (extractedMessage && typeof extractedMessage === 'string') {
        error.message = extractedMessage;
      }
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Handle 401 with token refresh
    if (error.response?.status === 401) {
      console.warn("[Axios Interceptor] 401 received. Attempting token refresh...");

      originalRequest._retry = true;

      const newToken = await refreshAccessToken();

      if (newToken) {
        console.log("[Axios Interceptor] Token refreshed. Retrying request.");

        // Token is already in memory via setAccessToken()
        if (originalRequest.headers) {
          originalRequest.headers.set
            ? originalRequest.headers.set("Authorization", `Bearer ${newToken}`)
            : (originalRequest.headers["Authorization"] = `Bearer ${newToken}`);
        }

        return axiosInstance(originalRequest);
      } else {
        console.error("[Axios Interceptor] Token refresh failed. Clearing auth.");
        clearAccessToken();
        delete axiosInstance.defaults.headers.common["Authorization"];
        return Promise.reject(error);
      }
    }

    if (error.response?.status === 403) {
      console.log("[Axios Interceptor] 🚨 403 Forbidden caught!");
    }

    return Promise.reject(error);
  }
);

// src/providers/auth/axiosInstance.ts

import { getAccessToken, setAccessToken } from "@/lib/auth/tokenStorage";
import { refreshAccessToken } from "@/lib/auth/api";
import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";

export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_ROOT_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// ✅ Add a request interceptor to include the access token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    // ✅ SECURITY FIX: Get token from memory instead of localStorage
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// ✅ Add a response interceptor for auto-refresh
axiosInstance.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    // 🔹 If the response is successful, just return it
    return response;
  },
  async (error: AxiosError): Promise<AxiosResponse | void> => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 🔹 If the originalRequest is undefined or _retry flag is set, we stop
    if (!originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      console.warn("[Axios Interceptor] 401 received. Attempting token refresh...");

      originalRequest._retry = true;

      const newToken = await refreshAccessToken();

      if (newToken) {
        console.log("[Axios Interceptor] Token refreshed. Retrying request.");

        // Token is already stored in memory by refreshAccessToken()

        // ✅ Update global axios header for future requests
        axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

        // ✅ Update this request's header and retry
        if (originalRequest.headers) {
          originalRequest.headers.set
            ? originalRequest.headers.set("Authorization", `Bearer ${newToken}`)
            : originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
        }

        return axiosInstance(originalRequest);

      } else {
        console.error("[Axios Interceptor] Token refresh failed.");
        return Promise.reject(error);
      }
    }

    if (error.response?.status === 403) {
        console.log("[Axios Interceptor] 🚨 403 Forbidden caught!");
        console.log("[Axios Interceptor] 🚨 Triggering unauthorized handler.");
    }

    return Promise.reject(error);
  }
);

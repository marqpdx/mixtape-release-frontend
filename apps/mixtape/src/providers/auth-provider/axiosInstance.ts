// src/providers/auth/axiosInstance.ts

import { getAccessToken } from "@mixtape/auth/tokenStorage";
import { refreshAccessToken } from "@mixtape/api/clients/auth/api";
import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";

export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_ROOT_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

const extractErrorMessage = (data: unknown): string | null => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }

  const record = data as Record<string, unknown>;
  if (typeof record.detail === "string") {
    return record.detail;
  }
  if (typeof record.error === "string") {
    return record.error;
  }

  const entries = Object.entries(record);
  if (!entries.length) {
    return null;
  }

  return entries
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : String(value)}`)
    .join("; ");
};


axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = getAccessToken();

    // Make sure headers exists
    config.headers = config.headers || {};

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    } else {
      // 🔥 Important: remove any stale Authorization header
      if ("Authorization" in config.headers) {
        delete (config.headers as Record<string, string>)["Authorization"];
      }
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);




// // ✅ Add a request interceptor to include the access token
// axiosInstance.interceptors.request.use(

//   (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
//     // ✅ SECURITY FIX: Get token from memory instead of localStorage
//     const token = getAccessToken();
//     if (token && config.headers) {
//       config.headers["Authorization"] = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error: AxiosError) => {
//     return Promise.reject(error);
//   }
// );

// ✅ Add a response interceptor for auto-refresh
import { clearAccessToken } from "@mixtape/auth/tokenStorage";
// maybe import a central logout handler if you have one

axiosInstance.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  async (error: AxiosError): Promise<AxiosResponse | void> => {
    // Extract Django error messages for better UX
    if (error.response?.data) {
      const data = error.response.data as unknown;
      const dataMessage = extractErrorMessage(data);
      // Try to extract meaningful error message from Django response
      const extractedMessage =
        dataMessage ||
        (typeof data === 'string' ? data : null);

      if (extractedMessage && typeof extractedMessage === 'string') {
        error.message = extractedMessage;
      }
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      console.warn("[Axios Interceptor] 401 received. Attempting token refresh...");

      originalRequest._retry = true;

      const newToken = await refreshAccessToken();

      if (newToken) {
        console.log("[Axios Interceptor] Token refreshed. Retrying request.");

        // Token is already in memory via setAccessToken()
        if (originalRequest.headers) {
          if (originalRequest.headers.set) {
            originalRequest.headers.set("Authorization", `Bearer ${newToken}`);
          } else {
            originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
          }
        }

        return axiosInstance(originalRequest);
      } else {
        console.error("[Axios Interceptor] Token refresh failed. Clearing auth.");
        clearAccessToken();
        delete axiosInstance.defaults.headers.common["Authorization"];
        // optionally trigger a global logout/redirect here
        return Promise.reject(error);
      }
    }

    if (error.response?.status === 403) {
      console.log("[Axios Interceptor] 🚨 403 Forbidden caught!");
      console.log("[Axios Interceptor] 🚨 Triggering unauthorized handler.");
      // optional: central unauthorized handler
    }

    return Promise.reject(error);
  }
);

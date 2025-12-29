// src/hooks/usePolling.ts

import { useEffect, useRef } from "react";
import { axiosInstance } from "../lib/axiosInstance";

type PollingOptions<T> = {
  url: string;
  onResult?: (data: T) => void;
  shouldContinue?: (data: T) => boolean;
  delay?: number;
  maxAttempts?: number;
};

export function usePolling<T>({
  url,
  onResult,
  shouldContinue,
  delay = 5000,
  maxAttempts = 10,
}: PollingOptions<T>) {
  const attemptsRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!url) return;

    const poll = async () => {
      try {
        console.log("[usePolling] polling URL:", url);

        const res = await axiosInstance.get(url);

        console.log("[usePolling] HTTP status:", res.status);
        console.log("[usePolling] Raw data:", res.data);

        const data: T = res.data;

        onResult?.(data);

        if (shouldContinue?.(data)) {
          attemptsRef.current += 1;

          if (attemptsRef.current < maxAttempts) {
            timerRef.current = setTimeout(poll, delay);
          }
        }
      } catch (e: any) {
        console.error("[usePolling] error polling:", e?.response?.data || e);
      }
    };

    poll();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [url]);

  return null;
}

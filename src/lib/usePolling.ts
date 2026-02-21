"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type PollStatus = "idle" | "running";

type UsePollingOptions<T> = {
  intervalMs?: number;
  onData: (data: T) => void;
  shouldStop: (data: T) => boolean;
  fetcher: () => Promise<T>;
  onError?: (message: string) => void;
};

export function usePolling<T>(options: UsePollingOptions<T>) {
  const { intervalMs = 1700, fetcher, onData, shouldStop, onError } = options;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const mountedRef = useRef(true);
  const [status, setStatus] = useState<PollStatus>("idle");

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    setStatus("idle");
    clearTimer();
  }, [clearTimer]);

  const tick = useCallback(async () => {
    if (!mountedRef.current || inFlightRef.current || status !== "running") {
      return;
    }

    inFlightRef.current = true;
    try {
      const data = await fetcher();
      if (!mountedRef.current) {
        return;
      }
      onData(data);
      if (shouldStop(data)) {
        stop();
        return;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      onError?.(message);
      stop();
      return;
    } finally {
      inFlightRef.current = false;
    }

    timerRef.current = setTimeout(() => {
      void tick();
    }, intervalMs);
  }, [fetcher, intervalMs, onData, onError, shouldStop, status, stop]);

  const start = useCallback(() => {
    if (status === "running") {
      return;
    }
    setStatus("running");
  }, [status]);

  useEffect(() => {
    if (status === "running") {
      void tick();
    }
  }, [status, tick]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimer();
    };
  }, [clearTimer]);

  return { status, start, stop };
}

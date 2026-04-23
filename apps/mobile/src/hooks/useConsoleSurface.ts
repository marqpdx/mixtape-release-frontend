import { useCallback, useEffect, useState } from 'react';
import type { ConsoleSurfaceData } from '../types/console';
import { getConsoleClient } from '../services/console/consoleClient';

const consoleClient = getConsoleClient();

export function useConsoleSurface() {
  const [data, setData] = useState<ConsoleSurfaceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const nextData = await consoleClient.getSurfaceData();
      setData(nextData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Console mobile surface.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    data,
    isLoading,
    error,
    reload: load,
  };
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError, homeService, type HomeSummary } from '@/lib/api';

interface UseHomeSummaryOptions {
  enabled?: boolean;
  initialData?: HomeSummary | null;
}

interface UseHomeSummaryResult {
  data: HomeSummary | null;
  loading: boolean;
  error: ApiError | null;
  refresh: () => Promise<void>;
}

export function useHomeSummary(options: UseHomeSummaryOptions = {}): UseHomeSummaryResult {
  const { enabled = true, initialData = null } = options;
  const [data, setData] = useState<HomeSummary | null>(initialData);
  const [loading, setLoading] = useState(enabled && !initialData);
  const [error, setError] = useState<ApiError | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await homeService.getSummaryWithFallback();
      setData(response);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void load();
  }, [enabled, load]);

  return {
    data,
    loading,
    error,
    refresh: load,
  };
}


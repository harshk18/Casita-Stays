import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api/client';

const MAX_QUERY_RETRIES = 2;

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) =>
          error instanceof ApiError &&
          error.retryable &&
          failureCount < MAX_QUERY_RETRIES,
      },
      mutations: { retry: false },
    },
  });
}

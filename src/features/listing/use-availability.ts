import { useQueries } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import { queryKeys } from '@/lib/query/keys';
import { availabilityResponseSchema } from '@/lib/validation/schemas';

/** months: 'YYYY-MM' strings. One cached query per month, fetched in parallel. */
export function useAvailability(listingId: string, months: string[]) {
  const results = useQueries({
    queries: months.map((month) => ({
      queryKey: queryKeys.availability.month(listingId, month),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        apiFetch(
          `/listings/${encodeURIComponent(listingId)}/availability?month=${month}`,
          availabilityResponseSchema,
          { signal },
        ),
    })),
  });

  const bookedDates = new Set(
    results.flatMap((r) => r.data?.bookedDates ?? []),
  );
  return {
    bookedDates,
    isPending: results.some((r) => r.isPending),
    isError: results.some((r) => r.isError),
    refetch: () => results.forEach((r) => void r.refetch()),
  };
}

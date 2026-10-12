import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import { queryKeys } from '@/lib/query/keys';
import { listingDetailSchema } from '@/lib/validation/schemas';

export function useListing(id: string) {
  return useQuery({
    queryKey: queryKeys.listings.detail(id),
    queryFn: ({ signal }) =>
      apiFetch(`/listings/${encodeURIComponent(id)}`, listingDetailSchema, {
        signal,
      }),
  });
}

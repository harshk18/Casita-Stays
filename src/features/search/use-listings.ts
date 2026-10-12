import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchListings } from '@/lib/api/listings';
import { queryKeys } from '@/lib/query/keys';
import type { ListingsQuery } from '@/lib/validation/schemas';

export function useListings(params: ListingsQuery) {
  return useQuery({
    queryKey: queryKeys.listings.list(params),
    queryFn: ({ signal }) => fetchListings(params, signal),
    placeholderData: keepPreviousData,
  });
}

import {
  listingsResponseSchema,
  type ListingsQuery,
} from '@/lib/validation/schemas';
import { apiFetch } from './client';

export function buildListingsSearch(params: ListingsQuery): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  return search.toString();
}

export function fetchListings(params: ListingsQuery, signal?: AbortSignal) {
  return apiFetch(
    `/listings?${buildListingsSearch(params)}`,
    listingsResponseSchema,
    { signal },
  );
}

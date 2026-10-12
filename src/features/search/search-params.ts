import {
  listingsQuerySchema,
  type ListingsQuery,
} from '@/lib/validation/schemas';

/** Accepts URLSearchParams or Next's ReadonlyURLSearchParams. Never throws. */
export function parseSearchParams(
  input: Iterable<[string, string]>,
): ListingsQuery {
  const raw: Record<string, string> = Object.fromEntries(
    Array.from(input).filter(([, value]) => value !== ''),
  );

  const first = listingsQuerySchema.safeParse(raw);
  if (first.success) return first.data;

  for (const issue of first.error.issues) delete raw[String(issue.path[0])];
  return listingsQuerySchema.parse(raw);
}

/** Canonical URL query string: fixed key order, defaults omitted. */
export function serializeSearchParams(query: ListingsQuery): string {
  const search = new URLSearchParams();
  if (query.city) search.set('city', query.city);
  if (query.minPrice !== undefined)
    search.set('minPrice', String(query.minPrice));
  if (query.maxPrice !== undefined)
    search.set('maxPrice', String(query.maxPrice));
  if (query.guests !== undefined) search.set('guests', String(query.guests));
  if (query.sort !== 'rating-desc') search.set('sort', query.sort);
  if (query.page > 1) search.set('page', String(query.page));
  return search.toString();
}

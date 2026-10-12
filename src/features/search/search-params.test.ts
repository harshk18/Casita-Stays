import { describe, expect, it } from 'vitest';
import type { ListingsQuery } from '@/lib/validation/schemas';
import { parseSearchParams, serializeSearchParams } from './search-params';

const parse = (qs: string) => parseSearchParams(new URLSearchParams(qs));
const DEFAULTS = { page: 1, sort: 'rating-desc' };

describe('parseSearchParams', () => {
  it('applies defaults for an empty query', () => {
    expect(parse('')).toEqual(DEFAULTS);
  });

  it('parses every field', () => {
    expect(parse('city=Berlin&minPrice=50&maxPrice=120&guests=2&sort=price-asc&page=3')).toEqual({
      city: 'Berlin',
      minPrice: 50,
      maxPrice: 120,
      guests: 2,
      sort: 'price-asc',
      page: 3,
    });
  });

  it.each([
    ['unknown city', 'city=Paris'],
    ['non-numeric page', 'page=abc'],
    ['page below 1', 'page=0'],
    ['fractional page', 'page=2.5'],
    ['zero guests', 'guests=0'],
    ['negative price', 'minPrice=-5'],
    ['unknown sort', 'sort=cheap'],
    ['empty value', 'minPrice='],
  ])('ignores an invalid value: %s', (_label, qs) => {
    expect(parse(qs)).toEqual(DEFAULTS);
  });

  it('keeps valid fields when another field is invalid', () => {
    expect(parse('city=Paris&guests=2')).toEqual({ ...DEFAULTS, guests: 2 });
  });
});

describe('serializeSearchParams', () => {
  it('omits defaults', () => {
    expect(serializeSearchParams({ page: 1, sort: 'rating-desc' })).toBe('');
  });

  it('uses a fixed key order', () => {
    expect(serializeSearchParams({ page: 2, sort: 'price-asc', city: 'Berlin' })).toBe(
      'city=Berlin&sort=price-asc&page=2',
    );
  });

  it('round-trips through parse', () => {
    const query: ListingsQuery = {
      city: 'Lisbon',
      minPrice: 40,
      maxPrice: 90,
      guests: 3,
      sort: 'price-desc',
      page: 4,
    };
    expect(parse(serializeSearchParams(query))).toEqual(query);
  });
});
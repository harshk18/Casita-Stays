import { describe, expect, it } from 'vitest';
import { CITIES, listingDetailSchema } from '@/lib/validation/schemas';
import { generateSeedData } from './data';

describe('seed data', () => {
  const { listings, stays } = generateSeedData();

  it('has at least 200 listings across the five cities', () => {
    expect(listings.length).toBeGreaterThanOrEqual(200);
    expect(new Set(listings.map((listing) => listing.city))).toEqual(
      new Set(CITIES),
    );
  });

  it('has unique ids', () => {
    expect(new Set(listings.map((listing) => listing.id)).size).toBe(
      listings.length,
    );
  });

  it('matches the ListingDetail schema', () => {
    const invalid = listings.filter(
      (listing) => !listingDetailSchema.safeParse(listing).success,
    );
    expect(invalid).toEqual([]);
  });

  it('is deterministic for the same seed', () => {
    expect(generateSeedData()).toEqual({ listings, stays });
  });

  it('never overlaps seeded stays for a listing', () => {
    for (const listingStays of Object.values(stays)) {
      for (let i = 1; i < listingStays.length; i++) {
        const previous = listingStays[i - 1];
        expect(listingStays[i].startOffsetDays).toBeGreaterThan(
          previous.startOffsetDays + previous.nights,
        );
      }
    }
  });
});

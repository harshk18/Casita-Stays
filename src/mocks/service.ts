import { addDays, eachNight, toIsoDate } from '@/domain/dates';
import { validateDateRange } from '@/domain/date-range';
import { calculatePrice } from '@/domain/pricing';
import { seedData, type SeedData } from '@/mocks/data';
import {
  PAGE_SIZE,
  type Listing,
  type Booking,
  type BookingRequest,
  type ListingDetail,
  type ListingsQuery,
  type ListingsResponse,
  type SortValue,
} from '@/lib/validation/schemas';

export type CreateBookingResult =
  | { ok: true; booking: Booking }
  | { ok: false; error: 'not-found' }
  | { ok: false; error: 'too-many-guests'; maxGuests: number }
  | {
      ok: false;
      error: 'invalid-range';
      issue: 'not-after-check-in' | 'in-the-past';
    }
  | { ok: false; error: 'conflict'; conflictingDates: string[] };

/**
 * In-memory fake backend. State lives in process memory, so it is NOT durable
 * across restarts and NOT shared between server instances. Fine for a local demo.
 */
export interface MockService {
  searchListings(query: ListingsQuery): ListingsResponse;
  getListing(id: string): ListingDetail | undefined;
  /** Booked nights for the month (`YYYY-MM`), or undefined for an unknown listing. */
  getBookedDates(id: string, month: string): string[] | undefined;
  /** Validates, prices and records a booking. Check and write are one synchronous step. */
  createBooking(request: BookingRequest): CreateBookingResult;
}

const byId = (a: ListingDetail, b: ListingDetail) => a.id.localeCompare(b.id);

// Every comparator ends in an id tiebreak so pages are stable and never overlap.
const COMPARATORS: Record<
  SortValue,
  (a: ListingDetail, b: ListingDetail) => number
> = {
  'rating-desc': (a, b) => b.rating - a.rating || byId(a, b),
  'price-asc': (a, b) => a.pricePerNight - b.pricePerNight || byId(a, b),
  'price-desc': (a, b) => b.pricePerNight - a.pricePerNight || byId(a, b),
};

function toListing(detail: ListingDetail): Listing {
  return {
    id: detail.id,
    title: detail.title,
    city: detail.city,
    pricePerNight: detail.pricePerNight,
    maxGuests: detail.maxGuests,
    rating: detail.rating,
    thumbnailUrl: detail.thumbnailUrl,
  };
}

function matchesQuery(listing: ListingDetail, query: ListingsQuery): boolean {
  return (
    (query.city === undefined || listing.city === query.city) &&
    (query.minPrice === undefined || listing.pricePerNight >= query.minPrice) &&
    (query.maxPrice === undefined || listing.pricePerNight <= query.maxPrice) &&
    (query.guests === undefined || listing.maxGuests >= query.guests)
  );
}

export function createMockService({
  data,
  today,
}: {
  data: SeedData;
  /** Injected clock returning `YYYY-MM-DD` (UTC). */
  today: () => string;
}): MockService {
  const listingsById = new Map(
    data.listings.map((listing) => [listing.id, listing]),
  );

  const bookedNights = new Map<string, Set<string>>();
  const seedDay = today();
  let bookingCount = 0;
  for (const listing of data.listings) {
    const nights = new Set<string>();
    for (const stay of data.stays[listing.id] ?? []) {
      const checkIn = addDays(seedDay, stay.startOffsetDays);
      for (const night of eachNight(checkIn, addDays(checkIn, stay.nights))) {
        nights.add(night);
      }
    }
    bookedNights.set(listing.id, nights);
  }

  return {
    searchListings(query) {
      const matching = data.listings
        .filter((listing) => matchesQuery(listing, query))
        .sort(COMPARATORS[query.sort]);
      const start = (query.page - 1) * PAGE_SIZE;
      return {
        items: matching.slice(start, start + PAGE_SIZE).map(toListing),
        total: matching.length,
        page: query.page,
        pageSize: PAGE_SIZE,
      };
    },

    getListing(id) {
      return listingsById.get(id);
    },

    getBookedDates(id, month) {
      const nights = bookedNights.get(id);
      if (!nights) return undefined;
      return [...nights].filter((night) => night.startsWith(month)).sort();
    },

    createBooking(request) {
      const listing = listingsById.get(request.listingId);
      const nights = bookedNights.get(request.listingId);
      if (!listing || !nights) return { ok: false, error: 'not-found' };

      if (request.guests > listing.maxGuests) {
        return {
          ok: false,
          error: 'too-many-guests',
          maxGuests: listing.maxGuests,
        };
      }

      const validation = validateDateRange({
        checkIn: request.checkIn,
        checkOut: request.checkOut,
        bookedDates: nights,
        today: today(),
      });
      if (!validation.valid) {
        return validation.issue === 'booked'
          ? {
              ok: false,
              error: 'conflict',
              conflictingDates: validation.conflictingDates,
            }
          : { ok: false, error: 'invalid-range', issue: validation.issue };
      }

      for (const night of eachNight(request.checkIn, request.checkOut)) {
        nights.add(night);
      }
      bookingCount += 1;

      return {
        ok: true,
        booking: {
          id: `bkg_${String(bookingCount).padStart(4, '0')}`,
          listingId: request.listingId,
          checkIn: request.checkIn,
          checkOut: request.checkOut,
          guests: request.guests,
          totalPrice:
            calculatePrice(listing.pricePerNight, validation.nights)
              .totalCents / 100,
        },
      };
    },
  };
}

// Route handlers can be bundled and hot-reloaded separately, so a plain
// module-level singleton could be created more than once. globalThis cannot.
const globalStore = globalThis as typeof globalThis & {
  __casitaMockService?: MockService;
};

export function getMockService(): MockService {
  globalStore.__casitaMockService ??= createMockService({
    data: seedData,
    today: () => toIsoDate(new Date()),
  });
  return globalStore.__casitaMockService;
}

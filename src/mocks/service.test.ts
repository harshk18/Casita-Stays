import { describe, expect, it } from 'vitest';
import { addDays, eachNight } from '@/domain/dates';
import { calculatePrice } from '@/domain/pricing';
import { SORT_VALUES, type BookingRequest } from '@/lib/validation/schemas';
import { generateSeedData, type SeedData } from './data';
import { createMockService } from './service';

const TODAY = '2026-10-12';
const seed = generateSeedData();
const listing = seed.listings[0];

function createFullService() {
  return createMockService({ data: seed, today: () => TODAY });
}

/** One listing with a known seeded stay: nights 2026-10-22 and 2026-10-23. */
function createService() {
  const data: SeedData = {
    listings: [listing],
    stays: { [listing.id]: [{ startOffsetDays: 10, nights: 2 }] },
  };
  return createMockService({ data, today: () => TODAY });
}

function bookingRequest(
  overrides: Partial<BookingRequest> = {},
): BookingRequest {
  return {
    listingId: listing.id,
    checkIn: '2026-11-02',
    checkOut: '2026-11-05',
    guests: 1,
    guestName: 'Ada Lovelace',
    guestEmail: 'ada@example.com',
    ...overrides,
  };
}

describe('searchListings', () => {
  it.each(SORT_VALUES)(
    'never repeats or skips items across pages sorted by %s',
    (sort) => {
      const service = createFullService();
      const first = service.searchListings({ page: 1, sort });
      const pageCount = Math.ceil(first.total / first.pageSize);
      const ids = Array.from({ length: pageCount }, (_, index) =>
        service
          .searchListings({ page: index + 1, sort })
          .items.map((item) => item.id),
      ).flat();

      expect(ids).toHaveLength(first.total);
      expect(new Set(ids).size).toBe(first.total);
    },
  );

  it('applies city, price and guest filters together', () => {
    const result = createFullService().searchListings({
      city: 'Prague',
      minPrice: 50,
      maxPrice: 80,
      guests: 3,
      page: 1,
      sort: 'price-asc',
    });

    expect(result.total).toBeGreaterThan(0);
    for (const item of result.items) {
      expect(item.city).toBe('Prague');
      expect(item.pricePerNight).toBeGreaterThanOrEqual(50);
      expect(item.pricePerNight).toBeLessThanOrEqual(80);
      expect(item.maxGuests).toBeGreaterThanOrEqual(3);
    }
    const prices = result.items.map((item) => item.pricePerNight);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });
});

describe('getBookedDates', () => {
  it('resolves seeded stays relative to today', () => {
    const service = createFullService();
    const [stay] = seed.stays[listing.id];
    const checkIn = addDays(TODAY, stay.startOffsetDays);

    for (const night of eachNight(checkIn, addDays(checkIn, stay.nights))) {
      expect(service.getBookedDates(listing.id, night.slice(0, 7))).toContain(
        night,
      );
    }
  });

  it('returns only the requested month', () => {
    const service = createService();
    expect(service.getBookedDates(listing.id, '2026-10')).toEqual([
      '2026-10-22',
      '2026-10-23',
    ]);
    expect(service.getBookedDates(listing.id, '2026-11')).toEqual([]);
  });

  it('returns undefined for an unknown listing', () => {
    expect(createService().getBookedDates('nope', '2026-10')).toBeUndefined();
  });
});

describe('createBooking', () => {
  it('creates a booking priced by the domain function', () => {
    expect(createService().createBooking(bookingRequest())).toEqual({
      ok: true,
      booking: {
        id: 'bkg_0001',
        listingId: listing.id,
        checkIn: '2026-11-02',
        checkOut: '2026-11-05',
        guests: 1,
        totalPrice: calculatePrice(listing.pricePerNight, 3).totalCents / 100,
      },
    });
  });

  it('turns a duplicate submission into a conflict', () => {
    const service = createService();
    service.createBooking(bookingRequest());

    expect(service.createBooking(bookingRequest())).toEqual({
      ok: false,
      error: 'conflict',
      conflictingDates: ['2026-11-02', '2026-11-03', '2026-11-04'],
    });
  });

  it('reports only the overlapping nights', () => {
    const service = createService();
    service.createBooking(bookingRequest());

    expect(
      service.createBooking(
        bookingRequest({ checkIn: '2026-11-04', checkOut: '2026-11-07' }),
      ),
    ).toEqual({
      ok: false,
      error: 'conflict',
      conflictingDates: ['2026-11-04'],
    });
  });

  it('shows new bookings in availability', () => {
    const service = createService();
    service.createBooking(bookingRequest());

    expect(service.getBookedDates(listing.id, '2026-11')).toEqual([
      '2026-11-02',
      '2026-11-03',
      '2026-11-04',
    ]);
  });

  it('allows checking out on a seeded booked night', () => {
    const result = createService().createBooking(
      bookingRequest({ checkIn: '2026-10-20', checkOut: '2026-10-22' }),
    );
    expect(result.ok).toBe(true);
  });

  it('leaves availability unchanged after a failed booking', () => {
    const service = createService();
    const before = service.getBookedDates(listing.id, '2026-10');

    service.createBooking(
      bookingRequest({ checkIn: '2026-10-21', checkOut: '2026-10-24' }),
    );

    expect(service.getBookedDates(listing.id, '2026-10')).toEqual(before);
  });

  it('rejects an unknown listing', () => {
    expect(
      createService().createBooking(bookingRequest({ listingId: 'nope' })),
    ).toEqual({ ok: false, error: 'not-found' });
  });

  it('rejects more guests than the listing sleeps', () => {
    expect(
      createService().createBooking(
        bookingRequest({ guests: listing.maxGuests + 1 }),
      ),
    ).toEqual({
      ok: false,
      error: 'too-many-guests',
      maxGuests: listing.maxGuests,
    });
  });

  it.each([
    {
      name: 'same-day',
      checkIn: '2026-11-02',
      checkOut: '2026-11-02',
      issue: 'not-after-check-in',
    },
    {
      name: 'past',
      checkIn: '2026-10-11',
      checkOut: '2026-10-13',
      issue: 'in-the-past',
    },
  ])('rejects a $name range', ({ checkIn, checkOut, issue }) => {
    expect(
      createService().createBooking(bookingRequest({ checkIn, checkOut })),
    ).toEqual({ ok: false, error: 'invalid-range', issue });
  });
});

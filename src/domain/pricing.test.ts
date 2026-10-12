import { describe, expect, it } from 'vitest';
import { calculatePrice } from './pricing';

describe('calculatePrice', () => {
  it('adds the cleaning fee and a 10% service fee to nights x rate', () => {
    expect(calculatePrice(100, 3)).toEqual({
      nights: 3,
      nightlyRateCents: 10000,
      subtotalCents: 30000,
      cleaningFeeCents: 4000,
      serviceFeeCents: 3000,
      totalCents: 37000,
    });
  });

  it('handles a single night', () => {
    expect(calculatePrice(100, 1)).toMatchObject({
      subtotalCents: 10000,
      serviceFeeCents: 1000,
      totalCents: 15000,
    });
  });

  it.each([
    { price: 50, nights: 7, total: 42500 },
    { price: 120, nights: 30, total: 400000 },
  ])(
    'totals $total cents for $nights nights at $price',
    ({ price, nights, total }) => {
      expect(calculatePrice(price, nights).totalCents).toBe(total);
    },
  );

  it('rounds each fee to whole cents, half up', () => {
    // 10.05 * 100 is 1005.0000000000001 in floating point, and the fee is exactly 100.5 cents.
    expect(calculatePrice(10.05, 1)).toMatchObject({
      nightlyRateCents: 1005,
      serviceFeeCents: 101,
      totalCents: 5106,
    });
  });

  it.each([0, -1, 1.5, Number.NaN])('rejects %s nights', (nights) => {
    expect(() => calculatePrice(100, nights)).toThrow(RangeError);
  });

  it('rejects a negative nightly rate', () => {
    expect(() => calculatePrice(-5, 1)).toThrow(RangeError);
  });
});

import { describe, expect, it } from 'vitest';
import { addDays, diffInDays, eachNight } from './dates';

describe('addDays', () => {
  it('crosses a month boundary', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
  });

  it('crosses a year boundary', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('includes 29 February in a leap year', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });

  it('skips 29 February in a non-leap year', () => {
    expect(addDays('2027-02-28', 1)).toBe('2027-03-01');
  });

  it('moves backwards with a negative count', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('eachNight', () => {
  it('excludes the check-out date', () => {
    expect(eachNight('2026-10-10', '2026-10-13')).toEqual([
      '2026-10-10',
      '2026-10-11',
      '2026-10-12',
    ]);
  });

  it('returns no nights for a same-day range', () => {
    expect(eachNight('2026-10-10', '2026-10-10')).toEqual([]);
  });

  it('returns no nights for a reversed range', () => {
    expect(eachNight('2026-10-13', '2026-10-10')).toEqual([]);
  });

  it('spans a month boundary', () => {
    expect(eachNight('2026-10-30', '2026-11-02')).toEqual([
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
    ]);
  });
});

describe('diffInDays', () => {
  it('counts across a leap day', () => {
    expect(diffInDays('2028-02-28', '2028-03-01')).toBe(2);
  });

  it('is zero for the same day', () => {
    expect(diffInDays('2026-10-12', '2026-10-12')).toBe(0);
  });

  it('is negative for a reversed range', () => {
    expect(diffInDays('2026-10-15', '2026-10-12')).toBe(-3);
  });

  it('is not affected by daylight saving changes', () => {
    // European clocks change on 2026-03-29; local-time maths would give 47 hours.
    expect(diffInDays('2026-03-28', '2026-03-30')).toBe(2);
  });
});

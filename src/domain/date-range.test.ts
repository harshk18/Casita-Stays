import { describe, expect, it } from 'vitest';
import { validateDateRange } from './date-range';

const TODAY = '2026-10-12';

function validate(
  checkIn: string,
  checkOut: string,
  bookedDates: string[] = [],
) {
  return validateDateRange({ checkIn, checkOut, bookedDates, today: TODAY });
}

describe('validateDateRange', () => {
  describe('night counting', () => {
    it('counts a one-night stay', () => {
      expect(validate('2026-10-20', '2026-10-21')).toEqual({
        valid: true,
        nights: 1,
      });
    });

    it('counts nights across a month boundary', () => {
      expect(validate('2026-10-30', '2026-11-02')).toEqual({
        valid: true,
        nights: 3,
      });
    });

    it('counts nights across a year boundary', () => {
      expect(validate('2026-12-30', '2027-01-02')).toEqual({
        valid: true,
        nights: 3,
      });
    });

    it('allows checking in today', () => {
      expect(validate('2026-10-12', '2026-10-13')).toEqual({
        valid: true,
        nights: 1,
      });
    });
  });

  describe('invalid ranges', () => {
    it.each([
      { name: 'same-day', checkIn: '2026-10-20', checkOut: '2026-10-20' },
      { name: 'reversed', checkIn: '2026-10-22', checkOut: '2026-10-20' },
    ])('rejects a $name range', ({ checkIn, checkOut }) => {
      expect(validate(checkIn, checkOut)).toEqual({
        valid: false,
        issue: 'not-after-check-in',
      });
    });

    it('rejects a check-in before today', () => {
      expect(validate('2026-10-11', '2026-10-13')).toEqual({
        valid: false,
        issue: 'in-the-past',
      });
    });

    it('reports the range shape before booked dates', () => {
      expect(validate('2026-10-20', '2026-10-20', ['2026-10-20'])).toEqual({
        valid: false,
        issue: 'not-after-check-in',
      });
    });
  });

  describe('booked dates', () => {
    it('blocks a range containing a booked night', () => {
      expect(validate('2026-10-20', '2026-10-25', ['2026-10-22'])).toEqual({
        valid: false,
        issue: 'booked',
        conflictingDates: ['2026-10-22'],
      });
    });

    it('blocks a range whose check-in night is booked', () => {
      expect(validate('2026-10-20', '2026-10-22', ['2026-10-20'])).toEqual({
        valid: false,
        issue: 'booked',
        conflictingDates: ['2026-10-20'],
      });
    });

    it('allows checking out on a booked date', () => {
      expect(validate('2026-10-20', '2026-10-23', ['2026-10-23'])).toEqual({
        valid: true,
        nights: 3,
      });
    });

    it('allows checking in the day after a booked night', () => {
      expect(validate('2026-10-23', '2026-10-25', ['2026-10-22'])).toEqual({
        valid: true,
        nights: 2,
      });
    });

    it('blocks a range crossing a month boundary into a booked night', () => {
      expect(validate('2026-10-30', '2026-11-03', ['2026-11-01'])).toEqual({
        valid: false,
        issue: 'booked',
        conflictingDates: ['2026-11-01'],
      });
    });

    it('reports every conflicting night in order', () => {
      expect(
        validate('2026-10-20', '2026-10-26', ['2026-10-24', '2026-10-21']),
      ).toEqual({
        valid: false,
        issue: 'booked',
        conflictingDates: ['2026-10-21', '2026-10-24'],
      });
    });

    it('ignores booked dates outside the range', () => {
      expect(
        validate('2026-10-20', '2026-10-22', ['2026-10-10', '2026-11-20']),
      ).toEqual({ valid: true, nights: 2 });
    });
  });
});

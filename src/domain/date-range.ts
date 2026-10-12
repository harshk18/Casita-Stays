import { diffInDays, eachNight } from './dates';

export type RangeValidation =
  | { valid: true; nights: number }
  | { valid: false; issue: 'not-after-check-in' | 'in-the-past' }
  | { valid: false; issue: 'booked'; conflictingDates: string[] };

export interface DateRangeInput {
  /** `YYYY-MM-DD`. ISO strings compare correctly as plain strings. */
  checkIn: string;
  /** Exclusive: the guest leaves this day, so this night is not occupied. */
  checkOut: string;
  /** Booked nights, possibly merged from several months. */
  bookedDates: Iterable<string>;
  /** Injected so the function stays pure and testable. */
  today: string;
}

export function validateDateRange({
  checkIn,
  checkOut,
  bookedDates,
  today,
}: DateRangeInput): RangeValidation {
  if (checkOut <= checkIn) {
    return { valid: false, issue: 'not-after-check-in' };
  }
  if (checkIn < today) {
    return { valid: false, issue: 'in-the-past' };
  }

  const booked = new Set(bookedDates);
  const conflictingDates = eachNight(checkIn, checkOut).filter((night) =>
    booked.has(night),
  );
  if (conflictingDates.length > 0) {
    return { valid: false, issue: 'booked', conflictingDates };
  }

  return { valid: true, nights: diffInDays(checkIn, checkOut) };
}

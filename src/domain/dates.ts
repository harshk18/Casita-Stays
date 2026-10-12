/**
 * Date-only helpers. All dates are `YYYY-MM-DD` strings handled in UTC, so
 * results never depend on the machine's timezone.
 */

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function addDays(iso: string, days: number): string {
  const date = parseIsoDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return toIsoDate(date);
}

/** Nights occupied by a stay: check-in inclusive, check-out exclusive. */
export function eachNight(checkIn: string, checkOut: string): string[] {
  const nights: string[] = [];
  for (let day = checkIn; day < checkOut; day = addDays(day, 1)) {
    nights.push(day);
  }
  return nights;
}

const MS_PER_DAY = 86_400_000;

/** Whole days from `from` to `to`; negative when `to` is earlier. Exact because both are UTC. */
export function diffInDays(from: string, to: string): number {
  return Math.round(
    (parseIsoDate(to).getTime() - parseIsoDate(from).getTime()) / MS_PER_DAY,
  );
}

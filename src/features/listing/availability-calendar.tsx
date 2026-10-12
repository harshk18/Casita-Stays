'use client';

import { useRef, useState, type KeyboardEvent } from 'react';
import { Alert, Box, Button, Skeleton, Typography } from '@mui/material';
import { addDays, toIsoDate } from '@/domain/dates';
import { useAvailability } from './use-availability';

export interface DateSelection {
  checkIn?: string;
  checkOut?: string;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const KEY_DELTAS: Record<string, number | undefined> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -7,
  ArrowDown: 7,
};

const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });

export function buildMonths(today: string) {
  const year = Number(today.slice(0, 4));
  const month0 = Number(today.slice(5, 7)) - 1;
  return [0, 1, 2].map((offset) => {
    const first = new Date(Date.UTC(year, month0 + offset, 1));
    const key = first.toISOString().slice(0, 7);
    const days = new Date(Date.UTC(year, month0 + offset + 1, 0)).getUTCDate();
    return {
      key,
      label: first.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }),
      blanks: (first.getUTCDay() + 6) % 7, // Monday-first grid
      dates: Array.from(
        { length: days },
        (_, i) => `${key}-${String(i + 1).padStart(2, '0')}`,
      ),
    };
  });
}

export function AvailabilityCalendar(props: {
  listingId: string;
  value: DateSelection;
  onChange: (value: DateSelection) => void;
}) {
  const { listingId, value, onChange } = props;
  const today = toIsoDate(new Date());
  const months = buildMonths(today);
  const { bookedDates, isPending, isError, refetch } = useAvailability(
    listingId,
    months.map((m) => m.key),
  );
  const [active, setActive] = useState(today);
  const containerRef = useRef<HTMLDivElement>(null);

  const pick = (iso: string) => {
    const { checkIn, checkOut } = value;
    if (checkIn && !checkOut && iso > checkIn) {
      onChange({ checkIn, checkOut: iso }); // validity (booked nights in between) is checked by the domain rules
      return;
    }
    if (iso < today || bookedDates.has(iso)) return; // a stay can't start on a past or booked night
    onChange({ checkIn: iso });
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const delta = KEY_DELTAS[e.key];
    if (delta === undefined) return;
    e.preventDefault();
    containerRef.current
      ?.querySelector<HTMLElement>(`[data-date="${addDays(active, delta)}"]`)
      ?.focus();
  };

  return (
    <Box component="section" aria-labelledby="availability-heading">
      <Typography
        id="availability-heading"
        variant="h6"
        component="h2"
        gutterBottom
      >
        Availability
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Choose check-in, then check-out. Struck-through nights are booked, but a
        booked day can be your check-out day. Use the arrow keys to move between
        days.
      </Typography>
      {isError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={refetch}>
              Retry
            </Button>
          }
        >
          Couldn’t load availability.
        </Alert>
      )}
      {isPending ? (
        <Skeleton
          variant="rounded"
          height={260}
          role="status"
          aria-label="Loading availability"
        />
      ) : (
        <Box
          ref={containerRef}
          onKeyDown={onKeyDown}
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 3,
          }}
        >
          {months.map((m) => (
            <Box key={m.key} role="group" aria-label={m.label}>
              <Typography variant="subtitle1" component="h3" align="center">
                {m.label}
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: 0.5,
                }}
              >
                {WEEKDAYS.map((d) => (
                  <Typography
                    key={d}
                    variant="caption"
                    align="center"
                    color="text.secondary"
                    aria-hidden
                  >
                    {d}
                  </Typography>
                ))}
                {Array.from({ length: m.blanks }, (_, i) => (
                  <Box key={`blank-${i}`} />
                ))}
                {m.dates.map((iso) => {
                  const booked = bookedDates.has(iso);
                  const past = iso < today;
                  const isStart = iso === value.checkIn;
                  const isEnd = iso === value.checkOut;
                  const selected = isStart || isEnd;
                  const inRange =
                    !!value.checkIn &&
                    !!value.checkOut &&
                    iso > value.checkIn &&
                    iso < value.checkOut;
                  const state = isStart
                    ? 'check-in'
                    : isEnd
                      ? 'check-out'
                      : booked
                        ? 'booked'
                        : past
                          ? 'unavailable'
                          : 'available';
                  return (
                    <Box
                      key={iso}
                      component="button"
                      type="button"
                      data-date={iso}
                      tabIndex={iso === active ? 0 : -1}
                      aria-label={`${longDate(iso)}, ${state}`}
                      aria-pressed={selected}
                      aria-disabled={past}
                      onFocus={() => setActive(iso)}
                      onClick={() => pick(iso)}
                      sx={{
                        p: 1,
                        border: 0,
                        borderRadius: 1,
                        font: 'inherit',
                        cursor: past ? 'not-allowed' : 'pointer',
                        bgcolor: selected
                          ? 'primary.main'
                          : inRange
                            ? 'action.selected'
                            : 'transparent',
                        color: selected
                          ? 'primary.contrastText'
                          : booked || past
                            ? 'text.disabled'
                            : 'text.primary',
                        textDecoration: booked ? 'line-through' : 'none',
                      }}
                    >
                      {Number(iso.slice(8))}
                    </Box>
                  );
                })}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

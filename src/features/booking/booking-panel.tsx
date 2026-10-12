'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { toIsoDate } from '@/domain/dates';
import { validateDateRange, type RangeValidation } from '@/domain/date-range';
import { SERVICE_FEE_PERCENT, calculatePrice } from '@/domain/pricing';
import {
  buildMonths,
  type DateSelection,
} from '@/features/listing/availability-calendar';
import { useAvailability } from '@/features/listing/use-availability';
import { ApiError } from '@/lib/api/client';
import { formatCents } from '@/lib/format';
import {
  apiErrorSchema,
  bookingRequestSchema,
  type BookingRequest,
} from '@/lib/validation/schemas';
import { useCreateBooking } from './use-create-booking';

function rangeMessage(v: Extract<RangeValidation, { valid: false }>): string {
  switch (v.issue) {
    case 'not-after-check-in':
      return 'Check-out must be after check-in.';
    case 'in-the-past':
      return 'Check-in can’t be in the past.';
    case 'booked':
      return `These nights are already booked: ${v.conflictingDates.join(', ')}.`;
  }
}

export function BookingPanel(props: {
  listingId: string;
  pricePerNight: number;
  maxGuests: number;
  range: DateSelection;
}) {
  const { listingId, pricePerNight, maxGuests, range } = props;
  const router = useRouter();
  const today = toIsoDate(new Date());
  const { bookedDates, isPending: loadingAvailability } = useAvailability(
    listingId,
    buildMonths(today).map((m) => m.key),
  );
  const booking = useCreateBooking();
  const { reset } = booking;
  const [form, setForm] = useState({
    guests: '1',
    guestName: '',
    guestEmail: '',
  });
  const [submitted, setSubmitted] = useState(false);

  // Choosing different dates makes a previous booking error stale.
  useEffect(() => {
    reset();
  }, [range.checkIn, range.checkOut, reset]);

  const validation =
    range.checkIn && range.checkOut
      ? validateDateRange({
          checkIn: range.checkIn,
          checkOut: range.checkOut,
          bookedDates,
          today,
        })
      : null;
  const price =
    validation && validation.valid
      ? calculatePrice(pricePerNight, validation.nights)
      : null;

  const guests = Number(form.guests);
  const errors = {
    guests:
      Number.isInteger(guests) && guests >= 1 && guests <= maxGuests
        ? undefined
        : `Enter between 1 and ${maxGuests} guests`,
    guestName: bookingRequestSchema.shape.guestName.safeParse(form.guestName)
      .success
      ? undefined
      : 'Enter your full name (at least 2 characters)',
    guestEmail: bookingRequestSchema.shape.guestEmail.safeParse(form.guestEmail)
      .success
      ? undefined
      : 'Enter a valid email address',
  };
  const hasErrors = Object.values(errors).some(Boolean);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (
      booking.isPending ||
      !range.checkIn ||
      !range.checkOut ||
      !validation?.valid ||
      hasErrors
    )
      return;
    const request: BookingRequest = {
      listingId,
      checkIn: range.checkIn,
      checkOut: range.checkOut,
      guests,
      guestName: form.guestName.trim(),
      guestEmail: form.guestEmail.trim(),
    };
    booking.mutate(request, {
      onSuccess: (b) =>
        router.push(
          `/booking-confirmation?${new URLSearchParams({
            id: b.id,
            listingId: b.listingId,
            checkIn: b.checkIn,
            checkOut: b.checkOut,
            guests: String(b.guests),
            totalPrice: String(b.totalPrice),
          })}`,
        ),
    });
  }

  const error = booking.error;
  const isConflict = error instanceof ApiError && error.status === 409;
  const conflictDates = isConflict
    ? (apiErrorSchema.shape.error.safeParse(error.details).data
        ?.conflictingDates ?? [])
    : [];

  const field = (name: keyof typeof form) => ({
    value: form[name],
    onChange: (e: { target: { value: string } }) =>
      setForm((f) => ({ ...f, [name]: e.target.value })),
    error: submitted && !!errors[name],
    helperText: submitted ? errors[name] : undefined,
  });

  return (
    <Box
      component="form"
      onSubmit={onSubmit}
      noValidate
      aria-label="Book this stay"
    >
      <Typography variant="h6">
        ${pricePerNight}{' '}
        <Typography component="span" color="text.secondary">
          / night
        </Typography>
      </Typography>
      <Typography aria-live="polite" sx={{ my: 1 }}>
        {range.checkIn
          ? `${range.checkIn} → ${range.checkOut ?? 'select check-out'}`
          : 'Select your dates in the calendar'}
      </Typography>

      {validation && !validation.valid && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {rangeMessage(validation)}
        </Alert>
      )}

      {price && (
        <Box component="dl" aria-label="Price breakdown" sx={{ m: 0, mb: 2 }}>
          {(
            [
              [
                `${formatCents(price.nightlyRateCents)} × ${price.nights} ${price.nights === 1 ? 'night' : 'nights'}`,
                price.subtotalCents,
              ],
              ['Cleaning fee', price.cleaningFeeCents],
              [`Service fee (${SERVICE_FEE_PERCENT}%)`, price.serviceFeeCents],
            ] as const
          ).map(([label, cents]) => (
            <Box
              key={label}
              sx={{ display: 'flex', justifyContent: 'space-between' }}
            >
              <dt>{label}</dt>
              <dd style={{ margin: 0 }}>{formatCents(cents)}</dd>
            </Box>
          ))}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: 700,
              mt: 1,
            }}
          >
            <dt>Total</dt>
            <dd style={{ margin: 0 }}>{formatCents(price.totalCents)}</dd>
          </Box>
        </Box>
      )}

      <Stack spacing={1.5}>
        <TextField
          label="Guests"
          type="number"
          size="small"
          required
          slotProps={{ htmlInput: { min: 1, max: maxGuests } }}
          {...field('guests')}
        />
        <TextField
          label="Full name"
          size="small"
          required
          autoComplete="name"
          {...field('guestName')}
        />
        <TextField
          label="Email"
          type="email"
          size="small"
          required
          autoComplete="email"
          {...field('guestEmail')}
        />

        {isConflict && (
          <Alert severity="warning">
            Someone just booked{' '}
            {conflictDates.length
              ? conflictDates.join(', ')
              : 'some of these nights'}
            . We’ve refreshed availability. Please choose different dates.
          </Alert>
        )}
        {error && !isConflict && (
          <Alert severity="error">
            {error instanceof ApiError && error.status === 503
              ? 'The booking service is temporarily unavailable. Nothing was booked, so you can try again.'
              : error.message}
          </Alert>
        )}

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={booking.isPending || loadingAvailability}
          startIcon={
            booking.isPending ? (
              <CircularProgress size={18} color="inherit" />
            ) : undefined
          }
        >
          {booking.isPending ? 'Booking…' : 'Reserve'}
        </Button>
      </Stack>
    </Box>
  );
}

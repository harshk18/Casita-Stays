'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Alert, Box, Button, Container, Typography } from '@mui/material';
import { useListing } from '@/features/listing/use-listing';
import { formatCents } from '@/lib/format';
import { bookingSchema, type Booking } from '@/lib/validation/schemas';

function Confirmed({ booking }: { booking: Booking }) {
  const { data } = useListing(booking.listingId); // already cached from the details page
  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        Booking confirmed
      </Typography>
      <Box
        component="dl"
        sx={{
          m: 0,
          display: 'grid',
          gridTemplateColumns: 'max-content 1fr',
          gap: 1,
          columnGap: 3,
        }}
      >
        {(
          [
            ['Reference', booking.id],
            ['Stay', data?.title ?? booking.listingId],
            ['Check-in', booking.checkIn],
            ['Check-out', booking.checkOut],
            ['Guests', String(booking.guests)],
            ['Total', formatCents(Math.round(booking.totalPrice * 100))],
          ] as const
        ).map(([label, value]) => (
          <Box key={label} sx={{ display: 'contents' }}>
            <dt style={{ fontWeight: 600 }}>{label}</dt>
            <dd style={{ margin: 0 }}>{value}</dd>
          </Box>
        ))}
      </Box>
    </>
  );
}

export function ConfirmationView() {
  const params = useSearchParams();
  const parsed = bookingSchema.safeParse({
    id: params.get('id'),
    listingId: params.get('listingId'),
    checkIn: params.get('checkIn'),
    checkOut: params.get('checkOut'),
    guests: Number(params.get('guests')),
    totalPrice: Number(params.get('totalPrice')),
  });

  return (
    <Container component="main" maxWidth="sm" sx={{ py: 6 }}>
      {parsed.success ? (
        <Confirmed booking={parsed.data} />
      ) : (
        <Alert severity="warning">We couldn’t find a booking to show.</Alert>
      )}
      <Button component={Link} href="/" sx={{ mt: 3 }}>
        Back to search
      </Button>
    </Container>
  );
}

'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { ApiError } from '@/lib/api/client';
import {
  AvailabilityCalendar,
  type DateSelection,
} from './availability-calendar';
import { useListing } from './use-listing';

// Thumbnails reuse the photo URL at a smaller size to avoid downloading 1200px images.
const thumb = (url: string) => url.replace('w=1200&h=800', 'w=240&h=160');

function Shell({ children }: { children: ReactNode }) {
  return (
    <Container component="main" maxWidth="lg" sx={{ py: 4 }}>
      <Button component={Link} href="/" sx={{ mb: 2 }}>
        ← Back to search
      </Button>
      {children}
    </Container>
  );
}

export function ListingDetailView({ id }: { id: string }) {
  const { data, error, isPending, isError, refetch } = useListing(id);
  const [range, setRange] = useState<DateSelection>({});
  const [photoIndex, setPhotoIndex] = useState(0);

  if (isPending) {
    return (
      <Shell>
        <Skeleton
          variant="rounded"
          height={420}
          role="status"
          aria-label="Loading listing"
        />
      </Shell>
    );
  }

  if (isError) {
    if (error instanceof ApiError && error.status === 404) {
      return (
        <Shell>
          <Alert severity="warning">
            Listing not found. It may have been removed.
          </Alert>
        </Shell>
      );
    }
    return (
      <Shell>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          Couldn’t load this listing: {error.message}
        </Alert>
      </Shell>
    );
  }

  const {
    title,
    city,
    rating,
    maxGuests,
    pricePerNight,
    description,
    photos,
    amenities,
    host,
  } = data;

  return (
    <Shell>
      <Typography variant="h4" component="h1">
        {title}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        {city} · up to {maxGuests} guests · ★ {rating.toFixed(1)}
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
          gap: 4,
          alignItems: 'start',
        }}
      >
        <Stack spacing={4}>
          <Box>
            <Box
              component="img"
              src={photos[photoIndex]}
              alt={`${title}, photo ${photoIndex + 1} of ${photos.length}`}
              width={1200}
              height={800}
              sx={{
                width: '100%',
                height: 'auto',
                aspectRatio: '3 / 2',
                objectFit: 'cover',
                borderRadius: 2,
              }}
            />
            <Stack
              direction="row"
              spacing={1}
              sx={{ mt: 1, overflowX: 'auto' }}
            >
              {photos.map((photo, i) => (
                <Box
                  key={photo}
                  component="button"
                  type="button"
                  aria-label={`Show photo ${i + 1}`}
                  aria-pressed={i === photoIndex}
                  onClick={() => setPhotoIndex(i)}
                  sx={{
                    p: 0,
                    flex: '0 0 auto',
                    border: 2,
                    borderColor:
                      i === photoIndex ? 'primary.main' : 'transparent',
                    borderRadius: 1,
                    cursor: 'pointer',
                    bgcolor: 'transparent',
                  }}
                >
                  <Box
                    component="img"
                    src={thumb(photo)}
                    alt=""
                    loading="lazy"
                    width={96}
                    height={64}
                    sx={{
                      display: 'block',
                      borderRadius: 0.5,
                      objectFit: 'cover',
                    }}
                  />
                </Box>
              ))}
            </Stack>
          </Box>

          <Box component="section" aria-labelledby="about-heading">
            <Typography
              id="about-heading"
              variant="h6"
              component="h2"
              gutterBottom
            >
              About this place
            </Typography>
            <Typography>{description}</Typography>
          </Box>

          <Box component="section" aria-labelledby="host-heading">
            <Typography
              id="host-heading"
              variant="h6"
              component="h2"
              gutterBottom
            >
              Your host
            </Typography>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <Avatar src={host.avatarUrl} alt="" />
              <Box>
                <Typography sx={{ fontWeight: 600 }}>{host.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {host.yearsHosting}{' '}
                  {host.yearsHosting === 1 ? 'year' : 'years'} hosting
                </Typography>
              </Box>
              {host.isSuperhost && (
                <Chip label="Superhost" color="primary" size="small" />
              )}
            </Stack>
          </Box>

          <Box component="section" aria-labelledby="amenities-heading">
            <Typography
              id="amenities-heading"
              variant="h6"
              component="h2"
              gutterBottom
            >
              Amenities
            </Typography>
            <Stack
              component="ul"
              direction="row"
              useFlexGap
              spacing={1}
              sx={{ flexWrap: 'wrap', p: 0, m: 0, listStyle: 'none' }}
            >
              {amenities.map((a) => (
                <Chip key={a} component="li" label={a} variant="outlined" />
              ))}
            </Stack>
          </Box>

          <AvailabilityCalendar
            listingId={id}
            value={range}
            onChange={setRange}
          />
        </Stack>

        <Box
          component="aside"
          aria-label="Booking"
          sx={{
            position: { md: 'sticky' },
            top: 16,
            p: 2,
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Typography variant="h6">${pricePerNight} / night</Typography>
          {/* Temporary: replaced by the booking panel in the next step. */}
          <Typography>
            {range.checkIn ?? '—'} → {range.checkOut ?? '—'}
          </Typography>
        </Box>
      </Box>
    </Shell>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Container,
  MenuItem,
  Pagination,
  Skeleton,
  TextField,
  Typography,
} from '@mui/material';
import {
  CITIES,
  SORT_VALUES,
  type ListingsQuery,
  type SortValue,
} from '@/lib/validation/schemas';
import { parseSearchParams, serializeSearchParams } from './search-params';
import { useListings } from './use-listings';

const SORT_LABELS: Record<SortValue, string> = {
  'rating-desc': 'Top rated',
  'price-asc': 'Price: low to high',
  'price-desc': 'Price: high to low',
};

const gridSx = {
  display: 'grid',
  gridTemplateColumns: {
    xs: '1fr',
    sm: 'repeat(2, 1fr)',
    md: 'repeat(3, 1fr)',
  },
  gap: 2,
  p: 0,
  m: 0,
  listStyle: 'none',
} as const;

function NumberFilter(props: {
  label: string;
  value: number | undefined;
  min: number;
  onCommit: (value: number | undefined) => void;
  error?: boolean;
  helperText?: string;
}) {
  const { label, value, min, onCommit, error, helperText } = props;
  const [text, setText] = useState(value?.toString() ?? '');
  const [synced, setSynced] = useState(value);
  // Re-sync when the URL changes externally (back/forward, clear filters).
  if (value !== synced) {
    setSynced(value);
    setText(value?.toString() ?? '');
  }

  // Debounce: commit to the URL 400 ms after the user stops typing.
  useEffect(() => {
    const parsed = text.trim() === '' ? undefined : Number(text);
    if (parsed === value) return;
    if (parsed !== undefined && (!Number.isInteger(parsed) || parsed < min))
      return;
    const id = setTimeout(() => onCommit(parsed), 400);
    return () => clearTimeout(id);
  }, [text, value, min, onCommit]);

  return (
    <TextField
      size="small"
      type="number"
      label={label}
      value={text}
      onChange={(e) => setText(e.target.value)}
      error={error}
      helperText={helperText}
      slotProps={{ htmlInput: { min, inputMode: 'numeric' } }}
      sx={{ width: 130 }}
    />
  );
}

export function SearchView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = useMemo(() => parseSearchParams(searchParams), [searchParams]);
  const { data, error, isPending, isFetching, isPlaceholderData, refetch } =
    useListings(query);

  const navigate = useCallback(
    (next: ListingsQuery, replace = false) => {
      const qs = serializeSearchParams(next);
      const url = qs ? `/?${qs}` : '/';
      if (replace) router.replace(url, { scroll: false });
      else router.push(url, { scroll: false });
    },
    [router],
  );
  const setFilter = useCallback(
    (patch: Partial<ListingsQuery>, replace = false) =>
      navigate({ ...query, page: 1, ...patch }, replace),
    [navigate, query],
  );

  const invalidRange =
    query.minPrice !== undefined &&
    query.maxPrice !== undefined &&
    query.minPrice > query.maxPrice;

  return (
    <Container component="main" maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Find your student stay
      </Typography>

      <Box
        component="form"
        role="search"
        aria-label="Filter stays"
        onSubmit={(e) => e.preventDefault()}
        sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}
      >
        <TextField
          select
          size="small"
          label="City"
          value={query.city ?? ''}
          onChange={(e) =>
            setFilter({
              city: (e.target.value || undefined) as ListingsQuery['city'],
            })
          }
          slotProps={{
            select: { displayEmpty: true },
            inputLabel: { shrink: true },
          }}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">All cities</MenuItem>
          {CITIES.map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </TextField>
        <NumberFilter
          label="Min price"
          value={query.minPrice}
          min={0}
          onCommit={(v) => setFilter({ minPrice: v }, true)}
        />
        <NumberFilter
          label="Max price"
          value={query.maxPrice}
          min={0}
          error={invalidRange}
          helperText={invalidRange ? 'Must be ≥ min' : undefined}
          onCommit={(v) => setFilter({ maxPrice: v }, true)}
        />
        <NumberFilter
          label="Guests"
          value={query.guests}
          min={1}
          onCommit={(v) => setFilter({ guests: v }, true)}
        />
        <TextField
          select
          size="small"
          label="Sort by"
          value={query.sort}
          onChange={(e) => setFilter({ sort: e.target.value as SortValue })}
          sx={{ minWidth: 190 }}
        >
          {SORT_VALUES.map((s) => (
            <MenuItem key={s} value={s}>
              {SORT_LABELS[s]}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          Couldn’t load stays: {error.message}
        </Alert>
      )}

      {isPending && (
        <Box
          role="status"
          aria-label="Loading stays"
          sx={gridSx}
          component="div"
        >
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} variant="rounded" height={280} />
          ))}
        </Box>
      )}

      {data &&
        (data.items.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6">No stays match your filters</Typography>
            <Button
              sx={{ mt: 2 }}
              onClick={() => navigate({ page: 1, sort: 'rating-desc' })}
            >
              Clear filters
            </Button>
          </Box>
        ) : (
          <Box
            aria-busy={isFetching}
            sx={{ opacity: isPlaceholderData ? 0.5 : 1 }}
          >
            <Typography role="status" color="text.secondary" sx={{ mb: 2 }}>
              {data.total} stays found
            </Typography>
            <Box component="ul" sx={gridSx}>
              {data.items.map((item, index) => (
                <Card key={item.id} component="li" variant="outlined">
                  <CardActionArea
                    component={Link}
                    href={`/listings/${item.id}`}
                  >
                    <CardMedia
                      component="img"
                      image={item.thumbnailUrl}
                      alt={item.title}
                      width={480}
                      height={320}
                      loading={index < 3 ? 'eager' : 'lazy'}
                      sx={{ aspectRatio: '3 / 2', objectFit: 'cover' }}
                    />
                    <CardContent>
                      <Typography variant="subtitle1" component="h2" noWrap>
                        {item.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.city} · up to {item.maxGuests} guests · ★{' '}
                        {item.rating.toFixed(1)}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ mt: 0.5, fontWeight: 600 }}
                      >
                        ${item.pricePerNight} / night
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
            </Box>
            <Pagination
              sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}
              count={Math.max(1, Math.ceil(data.total / data.pageSize))}
              page={query.page}
              onChange={(_, page) => {
                navigate({ ...query, page });
                window.scrollTo({ top: 0 });
              }}
            />
          </Box>
        ))}
    </Container>
  );
}

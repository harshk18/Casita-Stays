'use client';

import { Alert, Button, CircularProgress } from '@mui/material';
import { ApiError } from '@/lib/api/client';
import { useListing } from './use-listing';

export function ListingDetailView({ id }: { id: string }) {
  const { data, error, isPending, isError, refetch } = useListing(id);

  if (isPending) return <CircularProgress aria-label="Loading listing" />;

  if (isError) {
    if (error instanceof ApiError && error.status === 404) {
      return <Alert severity="warning">Listing not found.</Alert>;
    }
    return (
      <Alert
        severity="error"
        action={<Button onClick={() => refetch()}>Retry</Button>}
      >
        {error.message}
      </Alert>
    );
  }

  // Temporary debug view, replaced in Phase 7.
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}

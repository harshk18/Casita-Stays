import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import { queryKeys } from '@/lib/query/keys';
import { bookingSchema, type BookingRequest } from '@/lib/validation/schemas';

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    // No retry (client default) and no automatic resubmit: there is no idempotency key.
    mutationFn: (request: BookingRequest) =>
      apiFetch('/bookings', bookingSchema, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(request),
      }),
    // Success books new nights; a 409 means our calendar was stale. Either way, refetch.
    onSettled: (_data, _error, request) =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.availability.all(request.listingId),
      }),
  });
}

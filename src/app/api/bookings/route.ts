import { z } from 'zod';
import { bookingRequestSchema } from '@/lib/validation/schemas';
import {
  badRequest,
  errorResponse,
  jsonResponse,
  withChaos,
} from '@/mocks/http';
import { getMockService } from '@/mocks/service';

export async function POST(request: Request) {
  return withChaos(async () => {
    const body: unknown = await request.json().catch(() => undefined);
    const parsed = bookingRequestSchema.safeParse(body);
    if (!parsed.success) return badRequest(z.prettifyError(parsed.error));

    const result = getMockService().createBooking(parsed.data);
    if (result.ok) return jsonResponse(result.booking, 201);

    switch (result.error) {
      case 'not-found':
        return errorResponse(404, {
          code: 'NOT_FOUND',
          message: `Listing ${parsed.data.listingId} was not found.`,
        });
      case 'too-many-guests':
        return badRequest(
          `This listing sleeps at most ${result.maxGuests} guests.`,
        );
      case 'invalid-range':
        return badRequest(
          result.issue === 'in-the-past'
            ? 'Check-in cannot be in the past.'
            : 'Check-out must be after check-in.',
        );
      case 'conflict':
        return errorResponse(409, {
          code: 'CONFLICT',
          message:
            'Some of the selected nights were just booked by someone else.',
          conflictingDates: result.conflictingDates,
        });
    }
  });
}

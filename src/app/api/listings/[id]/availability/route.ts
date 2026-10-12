import { z } from 'zod';
import { availabilityQuerySchema } from '@/lib/validation/schemas';
import {
  badRequest,
  errorResponse,
  jsonResponse,
  withChaos,
} from '@/mocks/http';
import { getMockService } from '@/mocks/service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withChaos(() => {
    const query = availabilityQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    if (!query.success) return badRequest(z.prettifyError(query.error));

    const bookedDates = getMockService().getBookedDates(id, query.data.month);
    if (!bookedDates) {
      return errorResponse(404, {
        code: 'NOT_FOUND',
        message: `Listing ${id} was not found.`,
      });
    }
    return jsonResponse({ bookedDates });
  });
}

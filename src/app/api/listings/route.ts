import { z } from 'zod';
import { listingsQuerySchema } from '@/lib/validation/schemas';
import { badRequest, jsonResponse, withChaos } from '@/mocks/http';
import { getMockService } from '@/mocks/service';

export async function GET(request: Request) {
  return withChaos(() => {
    // `?city=&minPrice=` sends empty strings; treat them as "not provided".
    const params = Object.fromEntries(
      [...new URL(request.url).searchParams].filter(
        ([, value]) => value !== '',
      ),
    );
    const parsed = listingsQuerySchema.safeParse(params);
    if (!parsed.success) return badRequest(z.prettifyError(parsed.error));
    return jsonResponse(getMockService().searchListings(parsed.data));
  });
}

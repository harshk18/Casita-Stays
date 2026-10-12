import { errorResponse, jsonResponse, withChaos } from '@/mocks/http';
import { getMockService } from '@/mocks/service';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withChaos(() => {
    const listing = getMockService().getListing(id);
    if (!listing) {
      return errorResponse(404, {
        code: 'NOT_FOUND',
        message: `Listing ${id} was not found.`,
      });
    }
    return jsonResponse(listing);
  });
}

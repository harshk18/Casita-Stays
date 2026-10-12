import { getChaos } from '@/mocks/chaos';
import type { ApiError } from '@/lib/validation/schemas';

const JSON_HEADERS = { 'Cache-Control': 'no-store' };

export function jsonResponse<T>(data: T, status = 200): Response {
  return Response.json(data, { status, headers: JSON_HEADERS });
}

export function errorResponse(
  status: number,
  error: ApiError['error'],
): Response {
  const body: ApiError = { error };
  return Response.json(body, { status, headers: JSON_HEADERS });
}

export function badRequest(message: string): Response {
  return errorResponse(400, { code: 'VALIDATION_ERROR', message });
}

/** Applies the simulated latency and random failure before running the handler. */
export async function withChaos(
  handler: () => Response | Promise<Response>,
): Promise<Response> {
  const chaos = getChaos();
  await chaos.delay();
  if (chaos.shouldFail()) {
    return errorResponse(503, {
      code: 'SERVICE_UNAVAILABLE',
      message: 'Simulated outage. Please try again.',
    });
  }
  return handler();
}

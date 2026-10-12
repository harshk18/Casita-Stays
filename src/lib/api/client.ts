import type { z } from 'zod';

export class ApiError extends Error {
  constructor(
    readonly status: number, // 0 = network failure
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Safe to retry only for GETs: server errors and dropped connections. */
  get retryable() {
    return this.status === 0 || this.status >= 500;
  }
}

type ErrorBody = { error?: { code?: string; message?: string } } | null;

export async function apiFetch<S extends z.ZodType>(
  path: string,
  schema: S,
  init?: RequestInit,
): Promise<z.infer<S>> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, init);
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e; // let Query see cancellations
    throw new ApiError(0, 'NETWORK_ERROR', 'Network request failed.');
  }

  if (!res.ok) {
    const body: ErrorBody = await res.json().catch(() => null);
    throw new ApiError(
      res.status,
      body?.error?.code ?? 'HTTP_ERROR',
      body?.error?.message ?? res.statusText,
      body?.error,
    );
  }

  const parsed = schema.safeParse(await res.json());
  if (!parsed.success) {
    throw new ApiError(
      res.status,
      'INVALID_RESPONSE',
      'Unexpected response shape.',
    );
  }
  return parsed.data;
}

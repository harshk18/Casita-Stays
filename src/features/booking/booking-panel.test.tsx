import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toIsoDate } from '@/domain/dates';
import { BookingPanel } from './booking-panel';

const push = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toIsoDate(d);
}
const checkIn = daysFromNow(10);
const checkOut = daysFromNow(13); // 3 nights
const nights = [daysFromNow(10), daysFromNow(11), daysFromNow(12)];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

/** Fake backend: availability returns `booked`; POST returns `postResponse()`. */
function stubApi(opts: {
  postResponse: () => Response;
  booked: () => string[];
}) {
  const postSpy = vi.fn();
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        postSpy(JSON.parse(String(init.body)));
        return opts.postResponse();
      }
      if (url.includes('/availability')) {
        return json({ bookedDates: opts.booked() });
      }
      return json({ error: { code: 'NOT_FOUND', message: url } }, 404);
    }),
  );
  return postSpy;
}

function renderPanel() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <BookingPanel
        listingId="lst_001"
        pricePerNight={100}
        maxGuests={2}
        range={{ checkIn, checkOut }}
      />
    </QueryClientProvider>,
  );
  return userEvent.setup();
}

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/full name/i), 'Ada Lovelace');
  await user.type(screen.getByLabelText(/email/i), 'ada@example.com');
}

describe('BookingPanel', () => {
  beforeEach(() => push.mockClear());
  afterEach(() => vi.unstubAllGlobals());

  it('shows the live price breakdown for a valid range', async () => {
    stubApi({ booked: () => [], postResponse: () => json({}, 500) });
    renderPanel();
    expect(await screen.findByText('$100.00 × 3 nights')).toBeInTheDocument();
    expect(await screen.findByText('$100.00 × 3 nights')).toBeInTheDocument();
    expect(screen.getByText('$370.00')).toBeInTheDocument(); // 300 + 40 + 30
  });

  it('shows inline errors on an empty submit and sends nothing', async () => {
    const post = stubApi({
      booked: () => [],
      postResponse: () => json({}, 500),
    });
    const user = renderPanel();
    await user.click(await screen.findByRole('button', { name: /reserve/i }));
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(
      screen.getByText(/full name/i, { selector: 'p' }),
    ).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it('redirects to the confirmation page after a successful booking', async () => {
    const post = stubApi({
      booked: () => [],
      postResponse: () =>
        json(
          {
            id: 'bk_1',
            listingId: 'lst_001',
            checkIn,
            checkOut,
            guests: 1,
            totalPrice: 370,
          },
          201,
        ),
    });
    const user = renderPanel();
    await fillForm(user);
    await user.click(await screen.findByRole('button', { name: /reserve/i }));
    await waitFor(() => expect(push).toHaveBeenCalledTimes(1));
    expect(push.mock.calls[0][0]).toContain('/booking-confirmation?id=bk_1');
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('recovers from a 409: explains the conflict and refreshes availability', async () => {
    let booked: string[] = [];
    const post = stubApi({
      booked: () => booked,
      postResponse: () => {
        booked = nights; // someone else booked these nights meanwhile
        return json(
          {
            error: {
              code: 'CONFLICT',
              message: 'Dates unavailable',
              conflictingDates: nights,
            },
          },
          409,
        );
      },
    });
    const user = renderPanel();
    await fillForm(user);
    await user.click(await screen.findByRole('button', { name: /reserve/i }));

    expect(await screen.findByText(/someone just booked/i)).toHaveTextContent(
      nights[0],
    );
    // Availability was refetched, so the panel now flags the dates itself.
    expect(
      await screen.findByText(/these nights are already booked/i),
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
    expect(post).toHaveBeenCalledTimes(1); // no automatic retry
  });
});

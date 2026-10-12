export const CLEANING_FEE_CENTS = 4000;
export const SERVICE_FEE_PERCENT = 10;

export interface PriceBreakdown {
  nights: number;
  nightlyRateCents: number;
  subtotalCents: number;
  cleaningFeeCents: number;
  serviceFeeCents: number;
  totalCents: number;
}

/**
 * Price of a stay. `pricePerNight` is in USD; all results are integer cents.
 * The service fee is a percentage of the nights subtotal (cleaning fee excluded).
 * @throws RangeError when nights is not a positive integer or the rate is negative.
 */
export function calculatePrice(
  pricePerNight: number,
  nights: number,
): PriceBreakdown {
  if (!Number.isInteger(nights) || nights < 1) {
    throw new RangeError(`nights must be a positive integer, got ${nights}`);
  }
  if (!Number.isFinite(pricePerNight) || pricePerNight < 0) {
    throw new RangeError(`pricePerNight must be >= 0, got ${pricePerNight}`);
  }

  const nightlyRateCents = Math.round(pricePerNight * 100);
  const subtotalCents = nightlyRateCents * nights;
  const serviceFeeCents = Math.round(
    (subtotalCents * SERVICE_FEE_PERCENT) / 100,
  );

  return {
    nights,
    nightlyRateCents,
    subtotalCents,
    cleaningFeeCents: CLEANING_FEE_CENTS,
    serviceFeeCents,
    totalCents: subtotalCents + CLEANING_FEE_CENTS + serviceFeeCents,
  };
}

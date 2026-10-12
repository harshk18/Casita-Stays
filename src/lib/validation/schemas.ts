import { z } from 'zod';

export const CITIES = [
  'Lisbon',
  'Barcelona',
  'Berlin',
  'Prague',
  'Amsterdam',
] as const;
export const SORT_VALUES = ['rating-desc', 'price-asc', 'price-desc'] as const;
export const PAGE_SIZE = 20;

export const citySchema = z.enum(CITIES);
export const sortSchema = z.enum(SORT_VALUES);
/** Calendar date only, `YYYY-MM-DD`. Never a timestamp. */
export const isoDateSchema = z.iso.date();

export const listingSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  city: citySchema,
  pricePerNight: z.number().int().positive(), // USD
  maxGuests: z.number().int().min(1),
  rating: z.number().min(0).max(5),
  thumbnailUrl: z.string().min(1),
});

export const hostSchema = z.object({
  name: z.string().min(1),
  avatarUrl: z.string().min(1),
  yearsHosting: z.number().int().nonnegative(),
  isSuperhost: z.boolean(),
});

export const listingDetailSchema = listingSchema.extend({
  description: z.string().min(1),
  photos: z.array(z.string().min(1)).min(1),
  amenities: z.array(z.string().min(1)),
  host: hostSchema,
});

export const listingsResponseSchema = z.object({
  items: z.array(listingSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
});

export const availabilityResponseSchema = z.object({
  bookedDates: z.array(isoDateSchema),
});

export const bookingRequestSchema = z.object({
  listingId: z.string().min(1),
  checkIn: isoDateSchema,
  checkOut: isoDateSchema,
  guests: z.number().int().min(1),
  guestName: z.string().trim().min(2).max(80),
  guestEmail: z.email(),
});

/** Response shape exactly as specified in the brief. */
export const bookingSchema = z.object({
  id: z.string().min(1),
  listingId: z.string().min(1),
  checkIn: isoDateSchema,
  checkOut: isoDateSchema,
  guests: z.number().int().min(1),
  totalPrice: z.number().nonnegative(), // USD
});

export const API_ERROR_CODES = [
  'NOT_FOUND',
  'CONFLICT',
  'VALIDATION_ERROR',
  'SERVICE_UNAVAILABLE',
] as const;

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.enum(API_ERROR_CODES),
    message: z.string(),
    /** Present on 409: which requested nights are no longer free. */
    conflictingDates: z.array(isoDateSchema).optional(),
  }),
});

export type City = z.infer<typeof citySchema>;
export type SortValue = z.infer<typeof sortSchema>;
export type Listing = z.infer<typeof listingSchema>;
export type Host = z.infer<typeof hostSchema>;
export type ListingDetail = z.infer<typeof listingDetailSchema>;
export type ListingsResponse = z.infer<typeof listingsResponseSchema>;
export type AvailabilityResponse = z.infer<typeof availabilityResponseSchema>;
export type BookingRequest = z.infer<typeof bookingRequestSchema>;
export type Booking = z.infer<typeof bookingSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;

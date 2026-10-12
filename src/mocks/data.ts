import { createRng, type Rng } from '@/lib/random';
import {
  CITIES,
  type City,
  type ListingDetail,
} from '@/lib/validation/schemas';

/** A pre-existing booking, relative to "today" so the demo never goes stale. */
export interface SeedStay {
  /** Check-in, in days from today. */
  startOffsetDays: number;
  nights: number;
}

export interface SeedData {
  listings: ListingDetail[];
  stays: Record<string, SeedStay[]>;
}

const LISTINGS_PER_CITY = 48; // 5 cities x 48 = 240 listings

const CITY_CONFIG: Record<
  City,
  { neighbourhoods: readonly string[]; minPrice: number; maxPrice: number }
> = {
  Lisbon: {
    neighbourhoods: [
      'Alfama',
      'Baixa',
      'Príncipe Real',
      'Graça',
      'Alcântara',
      'Campo de Ourique',
    ],
    minPrice: 40,
    maxPrice: 120,
  },
  Barcelona: {
    neighbourhoods: [
      'Gràcia',
      'Eixample',
      'El Raval',
      'Poblenou',
      'Sants',
      'El Born',
    ],
    minPrice: 50,
    maxPrice: 140,
  },
  Berlin: {
    neighbourhoods: [
      'Kreuzberg',
      'Neukölln',
      'Mitte',
      'Prenzlauer Berg',
      'Friedrichshain',
      'Charlottenburg',
    ],
    minPrice: 45,
    maxPrice: 130,
  },
  Prague: {
    neighbourhoods: [
      'Vinohrady',
      'Žižkov',
      'Malá Strana',
      'Karlín',
      'Smíchov',
      'Holešovice',
    ],
    minPrice: 35,
    maxPrice: 100,
  },
  Amsterdam: {
    neighbourhoods: ['Jordaan', 'De Pijp', 'Oost', 'Noord', 'Zuid', 'Centrum'],
    minPrice: 70,
    maxPrice: 180,
  },
};

const PROPERTY_TYPES = [
  { name: 'private room', minGuests: 1, maxGuests: 2 },
  { name: 'studio', minGuests: 1, maxGuests: 2 },
  { name: 'apartment', minGuests: 2, maxGuests: 5 },
  { name: 'loft', minGuests: 2, maxGuests: 4 },
  { name: 'garden flat', minGuests: 3, maxGuests: 6 },
] as const;

const ADJECTIVES = [
  'Sunny',
  'Cozy',
  'Bright',
  'Quiet',
  'Modern',
  'Charming',
  'Spacious',
  'Renovated',
] as const;

const OPTIONAL_AMENITIES = [
  'Kitchen',
  'Washing machine',
  'Dedicated desk',
  'Heating',
  'Air conditioning',
  'Elevator',
  'Balcony',
  'Dishwasher',
  'Bike storage',
  'Smoke alarm',
  'Self check-in',
] as const;

const HOST_NAMES = [
  'Marta',
  'Jonas',
  'Elena',
  'Tomáš',
  'Sofia',
  'Lukas',
  'Ines',
  'Pieter',
  'Clara',
  'Mateo',
  'Anja',
  'David',
] as const;

const TRANSIT_LINES = [
  'Around 15 minutes by public transport to the main university campuses.',
  'A short walk to the metro, with campus connections nearby.',
  'Well connected by bus and tram to the city universities.',
  'Bike-friendly street with a quick ride to the student district.',
] as const;

const STAY_LINES = [
  'Ideal for semester-long stays and exchange students.',
  'A calm place to study, with a dedicated work area.',
  'Shared spaces are kept tidy, and the host replies quickly.',
  'Good for short stays around exams, internships and open days.',
] as const;

export function imageUrl(seed: string, width: number, height: number): string {
  return `/api/images/${encodeURIComponent(seed)}?w=${width}&h=${height}`;
}

function sample<T>(rng: Rng, items: readonly T[], count: number): T[] {
  const pool = [...items];
  const result: T[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const index = rng.int(0, pool.length - 1);
    result.push(pool.splice(index, 1)[0]);
  }
  return result;
}

function buildListing(rng: Rng, city: City, serial: number): ListingDetail {
  const config = CITY_CONFIG[city];
  const type = rng.pick(PROPERTY_TYPES);
  const neighbourhood = rng.pick(config.neighbourhoods);
  const adjective = rng.pick(ADJECTIVES);
  const maxGuests = rng.int(type.minGuests, type.maxGuests);
  const pricePerNight =
    rng.int(config.minPrice, config.maxPrice) + (maxGuests - 1) * 4;
  const rating = Math.round((3.5 + rng.next() * 1.5) * 10) / 10;

  const id = `lst_${String(serial).padStart(3, '0')}`;
  const title = `${adjective} ${type.name} in ${neighbourhood}`;
  const guestLabel = maxGuests === 1 ? 'guest' : 'guests';

  const photos = Array.from({ length: 5 }, (_, index) =>
    imageUrl(`${id}-${index}`, 1200, 800),
  );
  const amenities = [
    'Wi-Fi',
    ...sample(rng, OPTIONAL_AMENITIES, rng.int(4, 8)),
  ];
  const description = [
    `${title}, ${city}. Hosts up to ${maxGuests} ${guestLabel}.`,
    rng.pick(TRANSIT_LINES),
    rng.pick(STAY_LINES),
  ].join(' ');

  return {
    id,
    title,
    city,
    pricePerNight,
    maxGuests,
    rating,
    thumbnailUrl: imageUrl(`${id}-0`, 480, 320),
    description,
    photos,
    amenities,
    host: {
      name: rng.pick(HOST_NAMES),
      avatarUrl: imageUrl(`host-${id}`, 96, 96),
      yearsHosting: rng.int(1, 9),
      isSuperhost: rng.next() < 0.25,
    },
  };
}

/** 1-4 non-overlapping stays within roughly the next 3 months. */
function buildStays(rng: Rng): SeedStay[] {
  const stays: SeedStay[] = [];
  const count = rng.int(1, 4);
  let cursor = rng.int(1, 10);
  for (let i = 0; i < count && cursor < 85; i++) {
    const nights = rng.int(2, 6);
    stays.push({ startOffsetDays: cursor, nights });
    cursor += nights + rng.int(2, 20); // always leaves free nights between stays
  }
  return stays;
}

export function generateSeedData(seed = 20260101): SeedData {
  const rng = createRng(seed);
  const listings: ListingDetail[] = [];
  const stays: Record<string, SeedStay[]> = {};
  let serial = 1;

  for (const city of CITIES) {
    for (let i = 0; i < LISTINGS_PER_CITY; i++) {
      const listing = buildListing(rng, city, serial++);
      listings.push(listing);
      stays[listing.id] = buildStays(rng);
    }
  }

  return { listings, stays };
}

export const seedData = generateSeedData();

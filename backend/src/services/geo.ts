import proj4 from 'proj4';
import type { GeocodeResult, LocationInfo } from '../types.js';
import { DAY, cached } from './cache.js';

// Lower 48 states plus DC, by Census FIPS code.
const STATES: Record<string, { alpha: string; name: string }> = {
  '01': { alpha: 'AL', name: 'Alabama' }, '04': { alpha: 'AZ', name: 'Arizona' },
  '05': { alpha: 'AR', name: 'Arkansas' }, '06': { alpha: 'CA', name: 'California' },
  '08': { alpha: 'CO', name: 'Colorado' }, '09': { alpha: 'CT', name: 'Connecticut' },
  '10': { alpha: 'DE', name: 'Delaware' }, '11': { alpha: 'DC', name: 'District of Columbia' },
  '12': { alpha: 'FL', name: 'Florida' }, '13': { alpha: 'GA', name: 'Georgia' },
  '16': { alpha: 'ID', name: 'Idaho' }, '17': { alpha: 'IL', name: 'Illinois' },
  '18': { alpha: 'IN', name: 'Indiana' }, '19': { alpha: 'IA', name: 'Iowa' },
  '20': { alpha: 'KS', name: 'Kansas' }, '21': { alpha: 'KY', name: 'Kentucky' },
  '22': { alpha: 'LA', name: 'Louisiana' }, '23': { alpha: 'ME', name: 'Maine' },
  '24': { alpha: 'MD', name: 'Maryland' }, '25': { alpha: 'MA', name: 'Massachusetts' },
  '26': { alpha: 'MI', name: 'Michigan' }, '27': { alpha: 'MN', name: 'Minnesota' },
  '28': { alpha: 'MS', name: 'Mississippi' }, '29': { alpha: 'MO', name: 'Missouri' },
  '30': { alpha: 'MT', name: 'Montana' }, '31': { alpha: 'NE', name: 'Nebraska' },
  '32': { alpha: 'NV', name: 'Nevada' }, '33': { alpha: 'NH', name: 'New Hampshire' },
  '34': { alpha: 'NJ', name: 'New Jersey' }, '35': { alpha: 'NM', name: 'New Mexico' },
  '36': { alpha: 'NY', name: 'New York' }, '37': { alpha: 'NC', name: 'North Carolina' },
  '38': { alpha: 'ND', name: 'North Dakota' }, '39': { alpha: 'OH', name: 'Ohio' },
  '40': { alpha: 'OK', name: 'Oklahoma' }, '41': { alpha: 'OR', name: 'Oregon' },
  '42': { alpha: 'PA', name: 'Pennsylvania' }, '44': { alpha: 'RI', name: 'Rhode Island' },
  '45': { alpha: 'SC', name: 'South Carolina' }, '46': { alpha: 'SD', name: 'South Dakota' },
  '47': { alpha: 'TN', name: 'Tennessee' }, '48': { alpha: 'TX', name: 'Texas' },
  '49': { alpha: 'UT', name: 'Utah' }, '50': { alpha: 'VT', name: 'Vermont' },
  '51': { alpha: 'VA', name: 'Virginia' }, '53': { alpha: 'WA', name: 'Washington' },
  '54': { alpha: 'WV', name: 'West Virginia' }, '55': { alpha: 'WI', name: 'Wisconsin' },
  '56': { alpha: 'WY', name: 'Wyoming' },
};
const LOWER_48_NAMES = new Set(Object.values(STATES).map((s) => s.name));

// CONUS Albers (EPSG:5070), the projection CropScape expects.
const CONUS_ALBERS =
  '+proj=aea +lat_0=23 +lon_0=-96 +lat_1=29.5 +lat_2=45.5 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';

export function toConusAlbers(lat: number, lng: number): [number, number] {
  return proj4('EPSG:4326', CONUS_ALBERS, [lng, lat]) as [number, number];
}

export function inLower48Box(lat: number, lng: number): boolean {
  return lat >= 24.3 && lat <= 49.5 && lng >= -125 && lng <= -66.8;
}

export class LocationError extends Error {}

interface CensusCounty {
  NAME: string;
  BASENAME: string;
  STATE: string;
  COUNTY: string;
}

export function lookupCounty(lat: number, lng: number): Promise<LocationInfo> {
  const key = `county:${lat.toFixed(3)},${lng.toFixed(3)}`;
  return cached(key, DAY, async () => {
    const params = new URLSearchParams({
      x: String(lng),
      y: String(lat),
      benchmark: 'Public_AR_Current',
      vintage: 'Current_Current',
      layers: 'Counties',
      format: 'json',
    });
    const res = await fetch(
      `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?${params}`,
      { signal: AbortSignal.timeout(12_000) },
    );
    if (!res.ok) throw new Error(`Census geocoder returned HTTP ${res.status}`);
    const body = (await res.json()) as {
      result?: { geographies?: { Counties?: CensusCounty[] } };
    };
    const county = body.result?.geographies?.Counties?.[0];
    const state = county ? STATES[county.STATE] : undefined;
    if (!county || !state) {
      throw new LocationError('That spot is outside the lower 48 US states. Pick a spot in the continental US.');
    }
    return {
      lat,
      lng,
      label: `${county.NAME}, ${state.alpha}`,
      countyName: county.NAME,
      countyBaseName: county.BASENAME,
      stateAlpha: state.alpha,
      stateName: state.name,
    };
  });
}

interface OpenMeteoPlace {
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  admin2?: string;
  country_code?: string;
}

export function searchPlaces(query: string): Promise<GeocodeResult[]> {
  const key = `geocode:${query.toLowerCase()}`;
  return cached(key, DAY, async () => {
    const params = new URLSearchParams({ name: query, count: '8', countryCode: 'US', language: 'en', format: 'json' });
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`, {
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) throw new Error(`Geocoding returned HTTP ${res.status}`);
    const body = (await res.json()) as { results?: OpenMeteoPlace[] };
    return (body.results ?? [])
      .filter((p) => p.country_code === 'US' && p.admin1 && LOWER_48_NAMES.has(p.admin1))
      .slice(0, 5)
      .map((p) => ({
        label: `${p.name}, ${p.admin1}`,
        detail: p.admin2 ? `${p.admin2} County` : '',
        lat: p.latitude,
        lng: p.longitude,
      }));
  });
}

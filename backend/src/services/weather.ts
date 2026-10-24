import type { ClimateSummary, CurrentConditions } from '../types.js';
import { DAY, HOUR, cached } from './cache.js';

const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

// Placeholder values from the spec's Climate_Derivations sheet.
const FROST_C = 0;
const HISTORY_YEARS = 30;
const MIN_VALID_FRACTION = 0.95;
const GDD_BASE_F = 50;
const GDD_CAP_F = 86;

const MM_PER_IN = 25.4;
const MS_PER_DAY = 86_400_000;
const REFERENCE_YEAR = 2001; // non-leap year used to turn day numbers back into dates

export interface Climate {
  summary: ClimateSummary;
  // Average heat units for each day of the year (index 0 = Jan 1), used for crop stage dates.
  dailyGddNormals: number[];
}

interface ArchiveDaily {
  time: string[];
  temperature_2m_min: (number | null)[];
  temperature_2m_max: (number | null)[];
  precipitation_sum: (number | null)[];
}

const cToF = (c: number) => (c * 9) / 5 + 32;

function dailyGddF(minC: number, maxC: number): number {
  const clamp = (f: number) => Math.min(Math.max(f, GDD_BASE_F), GDD_CAP_F);
  return (clamp(cToF(minC)) + clamp(cToF(maxC))) / 2 - GDD_BASE_F;
}

// Day of year (1–365) with Feb 29 folded into Feb 28 so every year lines up.
function dayOfYear(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  const leapShift = m > 2 && new Date(Date.UTC(y, 1, 29)).getUTCMonth() === 1 ? 1 : 0;
  const doy = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / MS_PER_DAY) + 1;
  return Math.min(doy - leapShift, 365);
}

export function monthDayFromDoy(doy: number): string {
  const date = new Date(Date.UTC(REFERENCE_YEAR, 0, Math.round(doy)));
  return date.toISOString().slice(5, 10);
}

function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

const JUL_1 = 182;
const MAY_1 = 121;
const SEP_30 = 273;
const APR_1 = 91;

function summarize(daily: ArchiveDaily): Climate {
  const byYear = new Map<number, number[]>();
  daily.time.forEach((t, i) => {
    const year = Number(t.slice(0, 4));
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(i);
  });

  const lastSpring: number[] = [];
  const firstFall: number[] = [];
  const frostFree: number[] = [];
  const seasonGdd: number[] = [];
  const seasonRain: number[] = [];
  const gddSums = new Array<number>(365).fill(0);
  const gddCounts = new Array<number>(365).fill(0);
  let validYears = 0;

  for (const indices of byYear.values()) {
    const valid = indices.filter(
      (i) => daily.temperature_2m_min[i] !== null && daily.temperature_2m_max[i] !== null,
    );
    if (valid.length / indices.length < MIN_VALID_FRACTION) continue;
    validYears += 1;

    let spring: number | null = null;
    let fall: number | null = null;
    let gdd = 0;
    let rain = 0;
    for (const i of valid) {
      const doy = dayOfYear(daily.time[i]);
      const minC = daily.temperature_2m_min[i]!;
      const dayGdd = dailyGddF(minC, daily.temperature_2m_max[i]!);
      gddSums[doy - 1] += dayGdd;
      gddCounts[doy - 1] += 1;
      if (minC <= FROST_C) {
        if (doy < JUL_1) spring = doy;
        else if (fall === null) fall = doy;
      }
      if (doy >= MAY_1 && doy <= SEP_30) gdd += dayGdd;
      if (doy >= APR_1 && doy <= SEP_30) rain += daily.precipitation_sum[i] ?? 0;
    }
    if (spring !== null) lastSpring.push(spring);
    if (fall !== null) firstFall.push(fall);
    frostFree.push((fall ?? 366) - (spring ?? 0) - 1);
    seasonGdd.push(gdd);
    seasonRain.push(rain / MM_PER_IN);
  }

  if (validYears === 0) throw new Error('No complete years of weather history');

  // Treat frost as part of the climate only if it shows up in at least half the years.
  const frostTypical = (days: number[]) => days.length >= validYears / 2;
  const rainMean = seasonRain.reduce((a, b) => a + b, 0) / seasonRain.length;
  const rainSd = Math.sqrt(seasonRain.reduce((a, b) => a + (b - rainMean) ** 2, 0) / seasonRain.length);
  const round = (n: number) => Math.round(n);

  return {
    summary: {
      years: validYears,
      lastSpringFrost: frostTypical(lastSpring)
        ? { typical: monthDayFromDoy(percentile(lastSpring, 0.5)), late: monthDayFromDoy(percentile(lastSpring, 0.9)) }
        : null,
      firstFallFrost: frostTypical(firstFall)
        ? { early: monthDayFromDoy(percentile(firstFall, 0.1)), typical: monthDayFromDoy(percentile(firstFall, 0.5)) }
        : null,
      frostFreeDays: {
        p10: round(percentile(frostFree, 0.1)),
        p50: round(percentile(frostFree, 0.5)),
        p90: round(percentile(frostFree, 0.9)),
      },
      seasonalGddF: {
        p10: round(percentile(seasonGdd, 0.1)),
        p50: round(percentile(seasonGdd, 0.5)),
        p90: round(percentile(seasonGdd, 0.9)),
      },
      growingSeasonRainIn: Math.round(rainMean * 10) / 10,
      rainVariabilityPct: round((rainSd / rainMean) * 100),
    },
    dailyGddNormals: gddSums.map((sum, i) => (gddCounts[i] ? sum / gddCounts[i] : 0)),
  };
}

async function loadClimate(lat: number, lng: number): Promise<Climate> {
  const endYear = new Date().getFullYear() - 1;
  const params = new URLSearchParams({
    latitude: lat.toFixed(2),
    longitude: lng.toFixed(2),
    start_date: `${endYear - HISTORY_YEARS + 1}-01-01`,
    end_date: `${endYear}-12-31`,
    daily: 'temperature_2m_min,temperature_2m_max,precipitation_sum',
    timezone: 'auto',
  });
  const res = await fetch(`${ARCHIVE_URL}?${params}`, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`Weather history returned HTTP ${res.status}`);
  const body = (await res.json()) as { daily?: ArchiveDaily };
  if (!body.daily) throw new Error('Weather history response had no daily data');
  return summarize(body.daily);
}

export function getClimate(lat: number, lng: number): Promise<Climate> {
  // Neighboring points share the same ~10 km weather grid cell.
  const rLat = Math.round(lat * 10) / 10;
  const rLng = Math.round(lng * 10) / 10;
  return cached(`climate:${rLat},${rLng}`, DAY, () => loadClimate(rLat, rLng));
}

interface ForecastBody {
  current?: { time: string };
  hourly?: { time: string[]; soil_temperature_6cm: (number | null)[] };
  daily?: {
    time: string[];
    temperature_2m_max: (number | null)[];
    temperature_2m_min: (number | null)[];
    precipitation_sum: (number | null)[];
  };
}

async function loadCurrent(lat: number, lng: number): Promise<CurrentConditions> {
  const params = new URLSearchParams({
    latitude: lat.toFixed(2),
    longitude: lng.toFixed(2),
    current: 'temperature_2m',
    hourly: 'soil_temperature_6cm',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum',
    temperature_unit: 'fahrenheit',
    precipitation_unit: 'inch',
    timezone: 'auto',
    forecast_days: '7',
  });
  const res = await fetch(`${FORECAST_URL}?${params}`, { signal: AbortSignal.timeout(12_000) });
  if (!res.ok) throw new Error(`Forecast returned HTTP ${res.status}`);
  const body = (await res.json()) as ForecastBody;
  if (!body.current || !body.hourly || !body.daily) throw new Error('Forecast response was incomplete');

  const hour = body.current.time.slice(0, 13);
  const soilIndex = body.hourly.time.findIndex((t) => t.startsWith(hour));
  const soilTemp = soilIndex >= 0 ? body.hourly.soil_temperature_6cm[soilIndex] : null;
  const numbers = (values: (number | null)[]) => values.filter((v): v is number => v !== null);

  return {
    date: body.current.time.slice(0, 10),
    soilTempF: soilTemp === null ? null : Math.round(soilTemp),
    next7: {
      rainIn: Math.round(numbers(body.daily.precipitation_sum).reduce((a, b) => a + b, 0) * 100) / 100,
      lowF: Math.round(Math.min(...numbers(body.daily.temperature_2m_min))),
      highF: Math.round(Math.max(...numbers(body.daily.temperature_2m_max))),
    },
  };
}

export function getCurrentConditions(lat: number, lng: number): Promise<CurrentConditions> {
  const rLat = Math.round(lat * 10) / 10;
  const rLng = Math.round(lng * 10) / 10;
  return cached(`current:${rLat},${rLng}`, HOUR, () => loadCurrent(rLat, rLng));
}

export function dayOfYearFromIso(iso: string): number {
  return dayOfYear(iso);
}

import type { CountyBenchmark, FieldRecord, YieldComparison } from '../types.js';

const NASS_URL = 'https://quickstats.nass.usda.gov/api/api_GET/';
const SHORT_DESC = {
  Corn: 'CORN, GRAIN - YIELD, MEASURED IN BU / ACRE',
  Soybeans: 'SOYBEANS - YIELD, MEASURED IN BU / ACRE',
} as const;
const CACHE_MS = 24 * 60 * 60 * 1000;

type BenchmarkCrop = keyof typeof SHORT_DESC;
type CountyYields = Record<BenchmarkCrop, Record<number, number>>;

interface NassRow {
  year: number;
  Value: string;
  prodn_practice_desc: string;
}

let cache: { fetchedAt: number; yields: Promise<CountyYields | null> } | null = null;

async function fetchCropYields(key: string, crop: BenchmarkCrop): Promise<Record<number, number>> {
  const params = new URLSearchParams({
    key,
    source_desc: 'SURVEY',
    short_desc: SHORT_DESC[crop],
    agg_level_desc: 'COUNTY',
    state_alpha: 'IA',
    county_name: 'STORY',
    reference_period_desc: 'YEAR',
    year__GE: '2010',
    format: 'JSON',
  });
  const res = await fetch(`${NASS_URL}?${params}`, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`NASS returned HTTP ${res.status} for ${crop}`);
  const body = (await res.json()) as { data?: NassRow[] };

  const byYear: Record<number, number> = {};
  for (const row of body.data ?? []) {
    if (row.prodn_practice_desc !== 'ALL PRODUCTION PRACTICES') continue;
    // Withheld values come back as codes like "(D)", which parse to NaN.
    const value = Number(row.Value.replace(/,/g, ''));
    if (Number.isFinite(value)) byYear[row.year] = value;
  }
  return byYear;
}

export function getStoryCountyYields(): Promise<CountyYields | null> {
  const key = process.env.NASS_QUICK_STATS_API_KEY;
  if (!key) return Promise.resolve(null);
  if (cache && Date.now() - cache.fetchedAt < CACHE_MS) return cache.yields;

  const yields = Promise.all([fetchCropYields(key, 'Corn'), fetchCropYields(key, 'Soybeans')])
    .then(([Corn, Soybeans]) => ({ Corn, Soybeans }))
    .catch((err: Error) => {
      console.error('NASS county yields unavailable:', err.message);
      cache = null;
      return null;
    });
  cache = { fetchedAt: Date.now(), yields };
  return yields;
}

function percentDiff(field: number, county: number): number {
  return ((field - county) / county) * 100;
}

export function compareToCounty(field: FieldRecord, yields: CountyYields): CountyBenchmark | null {
  const cropByYear = new Map(field.cropHistory.value.map((c) => [c.year, c.crop]));

  const years: YieldComparison[] = [];
  for (const entry of field.yieldHistory.value) {
    const crop = cropByYear.get(entry.year);
    if (crop !== 'Corn' && crop !== 'Soybeans') continue;
    const county = yields[crop][entry.year];
    if (county === undefined) continue;
    years.push({ year: entry.year, crop, fieldBuAc: entry.bushelsPerAcre, countyBuAc: county });
  }
  if (years.length === 0) return null;

  const corn = years.filter((y) => y.crop === 'Corn');
  const basis = corn.length > 0 ? corn : years;
  const avg = basis.reduce((sum, y) => sum + percentDiff(y.fieldBuAc, y.countyBuAc), 0) / basis.length;
  const cropWord = basis === corn ? 'corn' : 'soybean';
  const span = `${basis[0].year}–${basis.at(-1)!.year}`;
  const rounded = Math.round(Math.abs(avg));

  const summary =
    rounded <= 3
      ? `Your ${cropWord} yields are about even with the Story County average (${span}).`
      : `Your ${cropWord} yields averaged ${rounded}% ${avg > 0 ? 'above' : 'below'} the Story County average (${span}).`;

  return {
    county: 'Story County, IA',
    source: 'USDA NASS Quick Stats',
    summary,
    years: years.sort((a, b) => a.year - b.year),
  };
}

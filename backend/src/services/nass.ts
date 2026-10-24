import type { CountyBenchmark, CountyStats, FieldRecord, LocationInfo, YieldComparison } from '../types.js';
import { DAY, cached } from './cache.js';

const NASS_URL = 'https://quickstats.nass.usda.gov/api/api_GET/';
const YIELD_DESC = {
  Corn: 'CORN, GRAIN - YIELD, MEASURED IN BU / ACRE',
  Soybeans: 'SOYBEANS - YIELD, MEASURED IN BU / ACRE',
} as const;
const CORN_ACRES = 'CORN, GRAIN - ACRES HARVESTED';
const IRRIGATED_CORN_ACRES = 'CORN, GRAIN, IRRIGATED - ACRES HARVESTED';
const CENSUS_YEAR = '2022';

type BenchmarkCrop = keyof typeof YIELD_DESC;

interface NassRow {
  year: number;
  Value: string;
  short_desc: string;
  prodn_practice_desc: string;
}

function nassCountyName(location: LocationInfo): string {
  return location.countyBaseName.toUpperCase().replace(/\./g, '');
}

async function query(key: string, params: Record<string, string>): Promise<NassRow[]> {
  const search = new URLSearchParams({ key, format: 'JSON', ...params });
  const res = await fetch(`${NASS_URL}?${search}`, { signal: AbortSignal.timeout(10_000) });
  // NASS answers 400 when a county has no rows for the query.
  if (res.status === 400) return [];
  if (!res.ok) throw new Error(`NASS returned HTTP ${res.status}`);
  const body = (await res.json()) as { data?: NassRow[] };
  return body.data ?? [];
}

function toNumber(value: string): number | null {
  // Withheld values come back as codes like "(D)", which parse to NaN.
  const n = Number(value.replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

async function loadCountyStats(key: string, location: LocationInfo): Promise<CountyStats> {
  const county = { agg_level_desc: 'COUNTY', state_alpha: location.stateAlpha, county_name: nassCountyName(location) };

  const yieldsFor = async (crop: BenchmarkCrop) => {
    const rows = await query(key, {
      ...county,
      source_desc: 'SURVEY',
      short_desc: YIELD_DESC[crop],
      reference_period_desc: 'YEAR',
      year__GE: String(new Date().getFullYear() - 15),
    });
    const byYear: Record<number, number> = {};
    for (const row of rows) {
      const value = toNumber(row.Value);
      if (row.prodn_practice_desc === 'ALL PRODUCTION PRACTICES' && value !== null) byYear[row.year] = value;
    }
    return byYear;
  };

  const irrigatedShare = async (): Promise<{ pct: number | null; withheld: boolean }> => {
    const rows = await query(key, {
      ...county,
      source_desc: 'CENSUS',
      year: CENSUS_YEAR,
      commodity_desc: 'CORN',
      statisticcat_desc: 'AREA HARVESTED',
      domain_desc: 'TOTAL',
    });
    const total = toNumber(rows.find((r) => r.short_desc === CORN_ACRES)?.Value ?? '');
    const irrigatedRow = rows.find((r) => r.short_desc === IRRIGATED_CORN_ACRES);
    const withheld = irrigatedRow ? /\(D\)/.test(irrigatedRow.Value) : false;
    const irrigated = irrigatedRow ? toNumber(irrigatedRow.Value) : null;
    const pct = total && irrigated !== null ? Math.round((irrigated / total) * 100) : null;
    return { pct, withheld };
  };

  const [corn, soybeans, irrigated] = await Promise.allSettled([
    yieldsFor('Corn'),
    yieldsFor('Soybeans'),
    irrigatedShare(),
  ]);
  const value = <T>(r: PromiseSettledResult<T>, fallback: T) => (r.status === 'fulfilled' ? r.value : fallback);

  const yields = { Corn: value(corn, {}), Soybeans: value(soybeans, {}) };
  if (corn.status === 'rejected' && soybeans.status === 'rejected' && irrigated.status === 'rejected') {
    throw corn.reason;
  }
  const irrigation = value(irrigated, { pct: null, withheld: false });
  return { yields, irrigatedCornSharePct: irrigation.pct, irrigationWithheld: irrigation.withheld };
}

export function getCountyStats(location: LocationInfo): Promise<CountyStats | null> {
  const key = process.env.NASS_QUICK_STATS_API_KEY;
  if (!key) return Promise.resolve(null);
  return cached(`nass:${location.stateAlpha}:${location.countyBaseName}`, DAY, () =>
    loadCountyStats(key, location),
  ).catch((err: Error) => {
    console.error('NASS county stats unavailable:', err.message);
    return null;
  });
}

function percentDiff(field: number, county: number): number {
  return ((field - county) / county) * 100;
}

export function compareToCounty(
  field: FieldRecord,
  stats: CountyStats,
  countyLabel: string,
): CountyBenchmark | null {
  const cropByYear = new Map(field.cropHistory.value.map((c) => [c.year, c.crop]));

  const years: YieldComparison[] = [];
  for (const entry of field.yieldHistory.value) {
    const crop = cropByYear.get(entry.year);
    if (crop !== 'Corn' && crop !== 'Soybeans') continue;
    const county = stats.yields[crop][entry.year];
    if (county === undefined) continue;
    years.push({ year: entry.year, crop, fieldBuAc: entry.bushelsPerAcre, countyBuAc: county });
  }
  if (years.length === 0) return null;

  const corn = years.filter((y) => y.crop === 'Corn');
  const basis = corn.length > 0 ? corn : years;
  const avg = basis.reduce((sum, y) => sum + percentDiff(y.fieldBuAc, y.countyBuAc), 0) / basis.length;
  const cropWord = basis === corn ? 'corn' : 'soybean';
  const rounded = Math.round(Math.abs(avg));
  const when = basis.length === 1 ? `in ${basis[0].year}` : `over ${basis[0].year}–${basis.at(-1)!.year}`;

  const summary =
    rounded <= 3
      ? `Your ${cropWord} yield was about even with the ${countyLabel} average ${when}.`
      : `Your ${cropWord} yield was ${rounded}% ${avg > 0 ? 'above' : 'below'} the ${countyLabel} average ${when}.`;

  return {
    county: countyLabel,
    source: 'USDA NASS Quick Stats',
    summary,
    years: years.sort((a, b) => a.year - b.year),
  };
}

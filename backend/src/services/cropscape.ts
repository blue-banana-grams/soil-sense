import type { CropHistoryEntry } from '../types.js';
import { DAY, cached } from './cache.js';
import { toConusAlbers } from './geo.js';

const CDL_URL = 'https://nassgeodata.gmu.edu/axis2/services/CDLService/GetCDLValue';
const YEARS_BACK = 5;

const NON_FARM = /developed|water|forest|wetlands|barren|shrubland|ice|clouds|nodata|background/i;

function normalizeCrop(category: string): string {
  const c = category.trim();
  if (c === 'Corn' || c === 'Sweet Corn' || c === 'Pop or Orn Corn') return 'Corn';
  if (c === 'Soybeans') return 'Soybeans';
  if (/^Dbl Crop .*Soybeans/i.test(c)) return 'Soybeans';
  if (/wheat/i.test(c)) return 'Wheat';
  if (c === 'Alfalfa' || /hay/i.test(c)) return 'Hay';
  if (/grassland|pasture/i.test(c)) return 'Pasture';
  if (/fallow|idle/i.test(c)) return 'Fallow';
  if (/developed/i.test(c)) return 'Developed';
  if (/water/i.test(c)) return 'Water';
  if (/forest/i.test(c)) return 'Forest';
  return c;
}

async function cropForYear(year: number, x: number, y: number): Promise<CropHistoryEntry | null> {
  const params = new URLSearchParams({ year: String(year), x: x.toFixed(1), y: y.toFixed(1) });
  const res = await fetch(`${CDL_URL}?${params}`, { signal: AbortSignal.timeout(12_000) });
  if (!res.ok) return null;
  const text = await res.text();
  const match = /category:\s*"([^"]*)"/.exec(text);
  if (!match) return null;
  return { year, crop: normalizeCrop(match[1]) };
}

async function loadHistory(lat: number, lng: number): Promise<CropHistoryEntry[]> {
  const [x, y] = toConusAlbers(lat, lng);
  const lastYear = new Date().getFullYear() - 1;
  const years = Array.from({ length: YEARS_BACK }, (_, i) => lastYear - i);
  const results = await Promise.allSettled(years.map((year) => cropForYear(year, x, y)));
  const history = results
    .map((r) => (r.status === 'fulfilled' ? r.value : null))
    .filter((entry): entry is CropHistoryEntry => entry !== null)
    .sort((a, b) => a.year - b.year);
  if (history.length === 0) throw new Error('CropScape returned no crop history');
  return history;
}

export function getCropHistory(lat: number, lng: number): Promise<CropHistoryEntry[]> {
  return cached(`cdl:${lat.toFixed(5)},${lng.toFixed(5)}`, DAY, () => loadHistory(lat, lng));
}

export function isNonFarmLand(crop: string): boolean {
  return NON_FARM.test(crop);
}

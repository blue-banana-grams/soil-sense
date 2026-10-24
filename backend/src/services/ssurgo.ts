import type { Measured, SoilProfile, Texture } from '../types.js';
import { DAY, cached } from './cache.js';

const SDA_URL = 'https://sdmdataaccess.sc.egov.usda.gov/Tabular/post.rest';
const TOP_DEPTH_CM = 30;
const CM_PER_IN = 2.54;

const TEXTURES: Texture[] = [
  'sand', 'loamy sand', 'sandy loam', 'loam', 'silt loam', 'clay loam', 'silty clay loam', 'clay',
];

const EROSION: Record<string, string> = {
  'Class 1': 'Slight',
  'Class 2': 'Moderate',
  'Class 3': 'Severe',
  'Class 4': 'Severe',
};

interface HorizonRow {
  muname: string;
  compname: string;
  slope_r: string | null;
  drainagecl: string | null;
  hydgrp: string | null;
  erocl: string | null;
  hzname: string | null;
  hzdept_r: string;
  hzdepb_r: string;
  om_r: string | null;
  ph1to1h2o_r: string | null;
  cec7_r: string | null;
  texdesc: string | null;
}

export class SoilDataMissingError extends Error {}

function auto<T>(value: T, unit?: string): Measured<T> {
  return { value, tier: 'auto', unit, method: 'USDA soil survey (SSURGO)' };
}

function num(value: string | null): number | null {
  if (value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// Thickness-weighted average of a property over the top 30 cm.
function topAverage(rows: HorizonRow[], pick: (r: HorizonRow) => string | null): number | null {
  let total = 0;
  let weight = 0;
  for (const row of rows) {
    const top = num(row.hzdept_r) ?? 0;
    const bottom = Math.min(num(row.hzdepb_r) ?? top, TOP_DEPTH_CM);
    const value = num(pick(row));
    if (bottom <= top || value === null) continue;
    total += value * (bottom - top);
    weight += bottom - top;
  }
  return weight > 0 ? total / weight : null;
}

function topsoilDepthCm(rows: HorizonRow[]): number {
  let depth = 0;
  for (const row of rows) {
    if (!row.hzname?.toUpperCase().startsWith('A')) break;
    depth = num(row.hzdepb_r) ?? depth;
  }
  return depth || (num(rows[0]?.hzdepb_r ?? null) ?? 0);
}

function toTexture(texdesc: string | null): Texture {
  const lower = texdesc?.toLowerCase() ?? '';
  return TEXTURES.find((t) => t === lower) ?? 'other';
}

function round(value: number, places = 1): number {
  const f = 10 ** places;
  return Math.round(value * f) / f;
}

async function querySoil(lat: number, lng: number): Promise<SoilProfile> {
  const point = `point(${lng.toFixed(6)} ${lat.toFixed(6)})`;
  const query = `
    SELECT mu.muname, c.compname, c.slope_r, c.drainagecl, c.hydgrp, c.erocl,
           h.hzname, h.hzdept_r, h.hzdepb_r, h.om_r, h.ph1to1h2o_r, h.cec7_r,
           (SELECT TOP 1 tg.texdesc FROM chtexturegrp tg
              WHERE tg.chkey = h.chkey AND tg.rvindicator = 'Yes') AS texdesc
    FROM mapunit mu
    JOIN component c ON c.mukey = mu.mukey
    JOIN chorizon h ON h.cokey = c.cokey
    WHERE mu.mukey IN (SELECT mukey FROM SDA_Get_Mukey_from_intersection_with_WktWgs84('${point}'))
      AND c.cokey = (SELECT TOP 1 c2.cokey FROM component c2
                       WHERE c2.mukey = mu.mukey ORDER BY c2.comppct_r DESC)
    ORDER BY h.hzdept_r`;

  const res = await fetch(SDA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ format: 'JSON+COLUMNNAME', query }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`Soil survey returned HTTP ${res.status}`);
  const body = (await res.json()) as { Table?: string[][] };
  const [header, ...data] = body.Table ?? [];
  if (!header || data.length === 0) {
    throw new SoilDataMissingError(
      'No soil survey data for this exact spot. It may be water, a town or unmapped land. Try moving the pin onto a field.',
    );
  }
  const rows = data.map(
    (cells) => Object.fromEntries(header.map((h, i) => [h, cells[i]])) as unknown as HorizonRow,
  );
  const first = rows[0];

  const organicMatter = topAverage(rows, (r) => r.om_r);
  const ph = topAverage(rows, (r) => r.ph1to1h2o_r);
  const cec = topAverage(rows, (r) => r.cec7_r);
  const slope = num(first.slope_r);
  if (organicMatter === null || slope === null) {
    throw new SoilDataMissingError(
      `The soil survey lists "${first.muname}" here but without the measurements we need. Try moving the pin onto a field.`,
    );
  }

  return {
    mapUnitComponent: first.muname,
    componentName: first.compname,
    organicMatterPct: auto(round(organicMatter), '%'),
    topsoilDepthIn: auto(round(topsoilDepthCm(rows) / CM_PER_IN), 'in'),
    slopePct: auto(slope, '%'),
    erosionClass: auto(first.erocl ? (EROSION[first.erocl] ?? 'None') : 'None'),
    drainageClass: auto(first.drainagecl ?? 'Unknown'),
    hydrologicGroup: auto(first.hydgrp ?? 'Unknown'),
    ph: ph === null ? undefined : auto(round(ph), 'pH'),
    cecMeq100g: cec === null ? undefined : auto(round(cec), 'meq/100g'),
    texture: auto(toTexture(first.texdesc)),
  };
}

export function getSoilProfile(lat: number, lng: number): Promise<SoilProfile> {
  return cached(`soil:${lat.toFixed(5)},${lng.toFixed(5)}`, DAY, () => querySoil(lat, lng));
}

import type { GrowthStage, SeasonCalendar } from '../types.js';
import type { Climate } from './weather.js';

// Placeholders pending agronomist review. Maturity varies by hybrid; the spec
// says it should become a user setting.
const STAGES = [
  { stage: 'Emergence (VE)', gdd: 100 },
  { stage: 'Six-leaf (V6)', gdd: 475 },
  { stage: 'Tasseling (VT)', gdd: 1400 },
  { stage: 'Silking (R1)', gdd: 1450 },
  { stage: 'Maturity (R6)', gdd: 2700 },
];
const PLANTING_GDD_PER_DAY = 5; // ~55°F average air temp, about when soil reaches 50°F
const PLANTING_EARLIEST_BEFORE_FROST_DAYS = 10;
const PLANTING_WINDOW_DAYS = 21;
const CORN_FROST_FREE_DAYS = 130;

const MS_PER_DAY = 86_400_000;

function doyFromMonthDay(monthDay: string): number {
  const [m, d] = monthDay.split('-').map(Number);
  return Math.round((Date.UTC(2001, m - 1, d) - Date.UTC(2001, 0, 1)) / MS_PER_DAY) + 1;
}

export function isoFromDoy(year: number, doy: number): string {
  return new Date(Date.UTC(year, 0, Math.round(doy))).toISOString().slice(0, 10);
}

export interface SeasonDates {
  plantStart: number;
  plantEnd: number;
  stageDoys: (number | null)[];
  maturity: number | null;
  harvestStart: number;
  harvestEnd: number;
  coverCropStart: number;
  coverCropEnd: number;
  firstFrost: number | null;
}

// All dates as day-of-year; the same climate gives the same dates every year.
export function seasonDates(climate: Climate): SeasonDates {
  const normals = climate.dailyGddNormals;
  const weekAvg = (doy: number) => {
    const days = normals.slice(doy - 1, doy + 6);
    return days.reduce((a, b) => a + b, 0) / days.length;
  };

  let plantStart = 32; // never before Feb 1
  while (plantStart < 200 && weekAvg(plantStart) < PLANTING_GDD_PER_DAY) plantStart += 1;
  const lastFrost = climate.summary.lastSpringFrost;
  if (lastFrost) {
    plantStart = Math.max(plantStart, doyFromMonthDay(lastFrost.typical) - PLANTING_EARLIEST_BEFORE_FROST_DAYS);
  }
  const plantEnd = plantStart + PLANTING_WINDOW_DAYS;

  const firstFrost = climate.summary.firstFallFrost
    ? doyFromMonthDay(climate.summary.firstFallFrost.typical)
    : null;
  const seasonEnd = firstFrost ?? 365;

  const stageDoys: (number | null)[] = [];
  let total = 0;
  let doy = plantStart;
  for (const { gdd } of STAGES) {
    while (total < gdd && doy < seasonEnd) {
      total += normals[doy - 1] ?? 0;
      doy += 1;
    }
    stageDoys.push(total >= gdd ? doy : null);
  }
  const maturity = stageDoys.at(-1) ?? null;

  const harvestStart = (maturity ?? seasonEnd) + 14;
  const harvestEnd = harvestStart + 31;
  const coverCropStart = harvestStart;
  const coverCropEnd = Math.max(coverCropStart + 21, (firstFrost ?? coverCropStart) + 14);

  return { plantStart, plantEnd, stageDoys, maturity, harvestStart, harvestEnd, coverCropStart, coverCropEnd, firstFrost };
}

export function buildSeasonCalendar(climate: Climate, year: number): SeasonCalendar {
  const dates = seasonDates(climate);
  const iso = (doy: number) => isoFromDoy(year, doy);

  const growthStages: GrowthStage[] = STAGES.map((s, i) => ({
    stage: s.stage,
    gddThreshold: s.gdd,
    estDate: dates.stageDoys[i] === null ? null : iso(dates.stageDoys[i]!),
  }));
  const v6 = dates.stageDoys[1];

  const notes: string[] = [];
  const { frostFreeDays, seasonalGddF, lastSpringFrost } = climate.summary;
  if (lastSpringFrost) {
    notes.push(`Frost usually ends around ${lastSpringFrost.typical.replace('-', '/')}; 1 year in 10 it comes as late as ${lastSpringFrost.late.replace('-', '/')}.`);
  }
  notes.push(
    frostFreeDays.p50 >= CORN_FROST_FREE_DAYS
      ? `A typical season here has ${frostFreeDays.p50} frost-free days, enough for corn.`
      : `A typical season here has only ${frostFreeDays.p50} frost-free days. Corn needs about ${CORN_FROST_FREE_DAYS}, so pick an early hybrid.`,
  );
  notes.push(`This area averages about ${seasonalGddF.p50.toLocaleString()} heat units (GDD) from May to September; pick a hybrid rated below that.`);
  if (dates.maturity === null) {
    notes.push(`A 2,700 GDD hybrid usually won't mature before the first fall frost here.`);
  }

  return {
    year,
    plantingWindow: { start: iso(dates.plantStart), end: iso(dates.plantEnd) },
    growthStages,
    fertilizerTiming:
      v6 === null
        ? 'Split nitrogen: about a third at planting, the rest sidedressed at V6.'
        : `Split nitrogen: about a third at planting, the rest sidedressed around V6 (about ${iso(v6).slice(5).replace('-', '/')}).`,
    harvestWindow: { start: iso(dates.harvestStart), end: iso(dates.harvestEnd) },
    coverCropWindow: { start: iso(dates.coverCropStart), end: iso(dates.coverCropEnd) },
    notes,
  };
}

// The season to plan for: this year's until corn would be mature, then next year's.
export function planningYear(climate: Climate, todayIso: string): number {
  const year = Number(todayIso.slice(0, 4));
  const today = doyFromMonthDay(todayIso.slice(5));
  const { maturity, harvestStart } = seasonDates(climate);
  return today > (maturity ?? harvestStart) ? year + 1 : year;
}

export function todayDoy(todayIso: string): number {
  return doyFromMonthDay(todayIso.slice(5));
}

import type {
  ConfidenceFactor,
  CountyStats,
  FarmerDetails,
  FieldRecord,
  Management,
  Measured,
  OverallConfidence,
  Report,
  SoilProfile,
} from '../types.js';
import { combineConfidence } from './confidence.js';
import { getCropHistory, isNonFarmLand } from './cropscape.js';
import { lookupCounty } from './geo.js';
import { compareToCounty, getCountyStats } from './nass.js';
import { getSoilProfile } from './ssurgo.js';
import { getClimate, getCurrentConditions } from './weather.js';
import { buildSeasonCalendar, planningYear } from './calendar.js';
import { buildThisWeek } from './season.js';
import { locationFactors, totalAdjustment } from './locationConfidence.js';
import { scoreField } from './scoring.js';
import { planRotation } from './rotation.js';
import { buildRecommendations, completeness } from './recommendations.js';
import { explainField } from './ai.js';
import { FIXES } from '../data/fixes.js';
import type { FixGroup, ScoreProblem } from '../types.js';

// One group per kind of problem, in the order the score lists them.
function fixesFor(problems: ScoreProblem[]): FixGroup[] {
  const groups = new Map<ScoreProblem['key'], FixGroup>();
  for (const { key, reason } of problems) {
    const group = groups.get(key) ?? { key, problems: [], practices: FIXES[key] };
    group.problems.push(reason);
    groups.set(key, group);
  }
  return [...groups.values()];
}

const settledValue = <T>(r: PromiseSettledResult<T>): T | null => (r.status === 'fulfilled' ? r.value : null);

function farmer<T>(value: T, unit?: string): Measured<T> {
  return { value, tier: 'farmer_entry', unit };
}

function applyLabTest(soil: SoilProfile, details: FarmerDetails): SoilProfile {
  const lab = details.labTest;
  if (!lab) return soil;
  const LAB = 'Lab soil test';
  // `method` stays undefined when the farmer didn't give one, so the spec's missing-method penalty applies.
  const measured = (value: number | undefined, unit: string, method: string | undefined) =>
    value === undefined ? undefined : { value, tier: 'lab' as const, unit, method, sampleDate: lab.sampleDate };

  return {
    ...soil,
    organicMatterPct: measured(lab.organicMatterPct, '%', LAB) ?? soil.organicMatterPct,
    ph: measured(lab.ph, 'pH', LAB) ?? soil.ph,
    bufferPh: measured(lab.bufferPh, 'pH', LAB),
    phosphorusPpm: measured(lab.phosphorusPpm, 'ppm', lab.pTestMethod),
    potassiumPpm: measured(lab.potassiumPpm, 'ppm', LAB),
    nitrateNPpm: measured(lab.nitrateNPpm, 'ppm', LAB),
  };
}

function managementFrom(details: FarmerDetails): Management {
  return {
    tillage: details.tillage ? farmer(details.tillage) : undefined,
    yieldGoalBuAc: details.yieldGoalBuAc ? farmer(details.yieldGoalBuAc, 'bu/ac') : undefined,
    amendments: details.amendments ? farmer(details.amendments) : undefined,
    pondingOrSlowDrying: details.pondingOrSlowDrying
      ? { value: details.pondingOrSlowDrying, tier: 'observation' }
      : undefined,
  };
}

function countyCornAverage(stats: CountyStats | null): number | null {
  const years = Object.keys(stats?.yields.Corn ?? {})
    .map(Number)
    .sort((a, b) => b - a)
    .slice(0, 5);
  if (!stats || years.length === 0) return null;
  return Math.round(years.reduce((sum, y) => sum + stats.yields.Corn[y], 0) / years.length);
}

// The soil and crop data behind the results. Management answers are left out on
// purpose: the spec scores them lower than map data and says to assess
// completeness separately, so answering questions never lowers confidence.
function headlineInputs(field: FieldRecord): Measured<unknown>[] {
  const { soil } = field;
  const candidates: (Measured<unknown> | undefined)[] = [
    soil.organicMatterPct,
    soil.topsoilDepthIn,
    soil.slopePct,
    soil.erosionClass,
    field.cropHistory,
    soil.ph,
    soil.bufferPh,
    soil.phosphorusPpm,
    soil.potassiumPpm,
    soil.nitrateNPpm,
  ];
  return candidates.filter((m): m is Measured<unknown> => m !== undefined);
}

function dataFactor(details: FarmerDetails): ConfidenceFactor {
  const lab = details.labTest;
  const detail = lab
    ? lab.sampleDate
      ? `Includes your lab soil test from ${lab.sampleDate}, the most reliable data there is.`
      : 'Includes your lab soil test. Adding the date it was sampled would raise this further.'
    : 'Based on USDA soil maps and satellite crop records, which are area averages, not tests of your field. A lab soil test raises this the most.';
  return { label: 'Soil data', detail, effect: 0 };
}

export async function buildReport(
  lat: number,
  lng: number,
  place: string | undefined,
  details: FarmerDetails,
): Promise<Report> {
  const soilP = getSoilProfile(lat, lng);
  const cropsP = getCropHistory(lat, lng);
  const climateP = getClimate(lat, lng);
  const currentP = getCurrentConditions(lat, lng);
  // Keep unawaited lookups from surfacing as unhandled rejections if we bail early.
  for (const p of [soilP, cropsP, climateP, currentP]) p.catch(() => undefined);

  const location = await lookupCounty(lat, lng);
  const [soilR, cropsR, climateR, currentR, statsR] = await Promise.allSettled([
    soilP,
    cropsP,
    climateP,
    currentP,
    getCountyStats(location),
  ]);
  if (soilR.status === 'rejected') throw soilR.reason;
  const optional: [string, PromiseSettledResult<unknown>][] = [
    ['crop history', cropsR],
    ['weather history', climateR],
    ['forecast', currentR],
  ];
  for (const [name, result] of optional) {
    if (result.status === 'rejected') console.error(`Report: ${name} unavailable:`, (result.reason as Error).message);
  }

  const crops = settledValue(cropsR);
  const climate = settledValue(climateR);
  const current = settledValue(currentR);
  const stats = settledValue(statsR);
  const placeName = place ?? location.label;

  const field: FieldRecord = {
    name: placeName,
    lat,
    lng,
    soil: applyLabTest(soilR.value, details),
    cropHistory: { value: crops ?? [], tier: 'auto', method: 'USDA CropScape (satellite)' },
    yieldHistory: farmer(details.yieldHistory ?? [], 'bu/ac'),
    management: managementFrom(details),
  };

  const factors = locationFactors({
    cropHistory: crops,
    climate: climate?.summary ?? null,
    irrigatedCornSharePct: stats?.irrigatedCornSharePct ?? null,
    irrigationWithheld: stats?.irrigationWithheld ?? false,
    countyName: location.countyName,
  });
  const adjustment = totalAdjustment(factors);

  const today = current?.date ?? new Date().toISOString().slice(0, 10);
  // Without weather history, plan for next year once summer is over.
  const seasonYear = climate
    ? planningYear(climate, today)
    : Number(today.slice(0, 4)) + (Number(today.slice(5, 7)) >= 8 ? 1 : 0);

  const score = scoreField(field, adjustment);
  const rotation = planRotation(field, seasonYear);
  const recommendations = buildRecommendations(field, rotation, adjustment);

  const inputs = headlineInputs(field);
  const headline = combineConfidence(inputs, adjustment);
  const confidence: OverallConfidence = {
    ...headline,
    dataValue: combineConfidence(inputs).value,
    factors: [dataFactor(details), ...factors],
  };

  const calendar = climate ? buildSeasonCalendar(climate, seasonYear) : null;
  const thisWeek = climate ? buildThisWeek(climate, today, current, rotation.years[0]?.crop ?? null) : null;

  const nonFarm = crops !== null && crops.filter((c) => isNonFarmLand(c.crop)).length >= Math.ceil(crops.length / 2);
  const urbanSoil = /urban land/i.test(field.soil.componentName);

  return {
    location,
    place: placeName,
    farmlandWarning:
      nonFarm || urbanSoil
        ? "This pin doesn't look like cropland (it may be in town, water or woods). Tap your field on the map to move it."
        : null,
    soil: field.soil,
    cropHistory: field.cropHistory,
    yieldHistory: field.yieldHistory,
    management: field.management,
    score,
    fixes: fixesFor(score.problems),
    confidence,
    completeness: completeness(recommendations),
    rotation,
    calendar,
    thisWeek,
    climate: climate?.summary ?? null,
    recommendations,
    countyBenchmark: stats ? compareToCounty(field, stats, location.countyName) : null,
    countyCornYieldAvg: countyCornAverage(stats),
    aiExplanation: explainField(placeName, score, rotation, headline),
    sources: [
      { name: 'USDA soil survey', ok: true },
      { name: 'USDA CropScape crop history', ok: crops !== null },
      { name: 'Weather history (Open-Meteo)', ok: climate !== null },
      { name: 'Weather forecast (Open-Meteo)', ok: current !== null },
      { name: 'USDA NASS county statistics', ok: stats !== null },
    ],
  };
}

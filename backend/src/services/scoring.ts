import type { CropHistoryEntry, FieldRecord, Measured, TopsoilScore } from '../types.js';
import { combineConfidence } from './confidence.js';
import { PH_ACIDIC_BELOW, PH_ALKALINE_ABOVE } from './thresholds.js';

// Placeholder weights: the spec defines no topsoil score, so every number here
// needs agronomist calibration.
const EROSION_PENALTY: Record<string, number> = {
  Slight: 0,
  Moderate: 10,
  Severe: 25,
};
const PH_PENALTY_PER_UNIT = 15;
const PH_PENALTY_MAX = 30;
const TILLAGE_PENALTY = { conventional: 10, reduced: 4, none: 0 };
const STEEP_SLOPE_PCT = 5;
const STEEP_CONVENTIONAL_EXTRA = 5;
const PONDING_PENALTY = { often: 8, sometimes: 3, never: 0 };

export function continuousCornYears(cropHistory: CropHistoryEntry[]): number {
  const sorted = [...cropHistory].sort((a, b) => b.year - a.year);
  let streak = 0;
  for (const entry of sorted) {
    if (entry.crop === 'Corn') streak += 1;
    else break;
  }
  return streak;
}

function labelFor(value: number): TopsoilScore['label'] {
  if (value >= 75) return 'Healthy';
  if (value >= 55) return 'Watch';
  if (value >= 35) return 'At risk';
  return 'Depleted';
}

export function scoreField(field: FieldRecord, confidenceAdjustment = 0): TopsoilScore {
  const { soil, cropHistory, management } = field;
  const organicMatter = soil.organicMatterPct.value;
  const topsoilDepth = soil.topsoilDepthIn.value;
  const slope = soil.slopePct.value;
  const erosionClass = soil.erosionClass.value;
  const problems: string[] = [];
  const strengths: string[] = [];
  const inputs: Measured<unknown>[] = [soil.organicMatterPct, soil.topsoilDepthIn, soil.slopePct, soil.erosionClass, cropHistory];

  let value = 100;

  const omPenalty = Math.max(0, (4 - organicMatter) * 10);
  if (omPenalty > 0) {
    value -= omPenalty;
    problems.push(`Organic matter is ${organicMatter}%, below the 4% target for resilient corn ground.`);
  }

  const depthPenalty = Math.max(0, (12 - topsoilDepth) * 3);
  if (depthPenalty > 0) {
    value -= depthPenalty;
    problems.push(`Topsoil is only ${topsoilDepth} in deep, thinner than the 12 in benchmark.`);
  }

  const slopePenalty = Math.max(0, (slope - 3) * 2.5);
  if (slopePenalty > 0) {
    value -= slopePenalty;
    problems.push(`Slope of ${slope}% raises runoff and erosion risk.`);
  }

  const erosionPenalty = EROSION_PENALTY[erosionClass] ?? 0;
  if (erosionPenalty > 0) {
    value -= erosionPenalty;
    problems.push(`Erosion class is rated "${erosionClass}".`);
  }

  const cornStreak = continuousCornYears(cropHistory.value);
  const cornPenalty = Math.min(25, Math.max(0, cornStreak - 1) * 6);
  if (cornPenalty > 0) {
    value -= cornPenalty;
    problems.push(`${cornStreak} straight years of corn are drawing down organic matter faster than it rebuilds.`);
  }

  // Only a tested pH counts; the soil map's area average isn't enough to judge a field (spec pH gate).
  const ph = soil.ph;
  if (ph && ph.tier !== 'auto') {
    inputs.push(ph);
    if (ph.value < PH_ACIDIC_BELOW) {
      value -= Math.min(PH_PENALTY_MAX, (PH_ACIDIC_BELOW - ph.value) * PH_PENALTY_PER_UNIT);
      problems.push(`Tested pH ${ph.value} is acidic, which locks up nutrients and slows soil life.`);
    } else if (ph.value > PH_ALKALINE_ABOVE) {
      value -= Math.min(PH_PENALTY_MAX, (ph.value - PH_ALKALINE_ABOVE) * PH_PENALTY_PER_UNIT);
      problems.push(`Tested pH ${ph.value} is alkaline, which ties up phosphorus and micronutrients.`);
    } else {
      strengths.push(`Tested pH ${ph.value} is in a good range for corn.`);
    }
  }

  const tillage = management.tillage;
  if (tillage) {
    inputs.push(tillage);
    const type = tillage.value.type;
    const steep = slope > STEEP_SLOPE_PCT;
    const penalty = TILLAGE_PENALTY[type] + (type === 'conventional' && steep ? STEEP_CONVENTIONAL_EXTRA : 0);
    value -= penalty;
    if (type === 'conventional') {
      problems.push(
        steep
          ? 'Conventional tillage on this slope breaks down soil structure and leaves it open to erosion.'
          : 'Conventional tillage breaks down soil structure and burns off organic matter.',
      );
    } else if (type === 'reduced') {
      problems.push('Reduced tillage still disturbs some soil; no-till would protect it more.');
    } else {
      strengths.push('No-till is protecting your topsoil.');
    }
  }

  const ponding = management.pondingOrSlowDrying;
  if (ponding) {
    inputs.push(ponding);
    value -= PONDING_PENALTY[ponding.value];
    if (ponding.value === 'often') problems.push('Frequent ponding points to compaction or poor drainage.');
    if (ponding.value === 'sometimes') problems.push('Occasional ponding can mean compacted spots.');
  }

  const reasons = problems.length > 0 ? [...problems, ...strengths] : ['Soil and rotation history both look within healthy ranges.', ...strengths];
  value = Math.max(0, Math.min(100, Math.round(value)));

  return {
    value,
    label: labelFor(value),
    reasons,
    confidence: combineConfidence(inputs, confidenceAdjustment),
  };
}

import type { CropHistoryEntry, FieldRecord, TopsoilScore } from '../types.js';
import { combineConfidence } from './confidence.js';

// Placeholder cutoffs: the spec gives no organic matter, depth, or slope targets.
const EROSION_PENALTY: Record<string, number> = {
  Slight: 0,
  Moderate: 10,
  Severe: 25,
};

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

export function scoreField(field: FieldRecord): TopsoilScore {
  const { soil, cropHistory } = field;
  const organicMatter = soil.organicMatterPct.value;
  const topsoilDepth = soil.topsoilDepthIn.value;
  const slope = soil.slopePct.value;
  const erosionClass = soil.erosionClass.value;
  const reasons: string[] = [];

  let value = 100;

  const omPenalty = Math.max(0, (4 - organicMatter) * 10);
  if (omPenalty > 0) {
    value -= omPenalty;
    reasons.push(
      `Organic matter is ${organicMatter}%, below the 4% target for resilient corn ground.`,
    );
  }

  const depthPenalty = Math.max(0, (12 - topsoilDepth) * 3);
  if (depthPenalty > 0) {
    value -= depthPenalty;
    reasons.push(`Topsoil is only ${topsoilDepth} in deep, thinner than the 12 in benchmark.`);
  }

  const slopePenalty = Math.max(0, (slope - 3) * 2.5);
  if (slopePenalty > 0) {
    value -= slopePenalty;
    reasons.push(`Slope of ${slope}% raises runoff and erosion risk.`);
  }

  const erosionPenalty = EROSION_PENALTY[erosionClass] ?? 0;
  if (erosionPenalty > 0) {
    value -= erosionPenalty;
    reasons.push(`Erosion class is rated "${erosionClass}".`);
  }

  const cornStreak = continuousCornYears(cropHistory.value);
  const cornPenalty = Math.min(25, Math.max(0, cornStreak - 1) * 6);
  if (cornPenalty > 0) {
    reasons.push(`${cornStreak} straight years of corn are drawing down organic matter faster than it rebuilds.`);
    value -= cornPenalty;
  }

  if (reasons.length === 0) {
    reasons.push('Soil and rotation history both look within healthy ranges.');
  }

  value = Math.max(0, Math.min(100, Math.round(value)));

  const confidence = combineConfidence([
    soil.organicMatterPct,
    soil.topsoilDepthIn,
    soil.slopePct,
    soil.erosionClass,
    cropHistory,
  ]);

  return { value, label: labelFor(value), reasons, confidence };
}

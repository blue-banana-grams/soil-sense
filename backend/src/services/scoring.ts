import type { CropHistoryEntry, FieldRecord, SoilProfile, TopsoilScore } from '../types.js';

const EROSION_PENALTY: Record<string, number> = {
  Slight: 0,
  Moderate: 10,
  Severe: 25,
};

function continuousCornYears(cropHistory: CropHistoryEntry[]): number {
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
  const reasons: string[] = [];

  let value = 100;

  const omPenalty = Math.max(0, (4 - soil.organicMatterPct) * 10);
  if (omPenalty > 0) {
    value -= omPenalty;
    reasons.push(
      `Organic matter is ${soil.organicMatterPct}%, below the 4% target for resilient corn ground.`,
    );
  }

  const depthPenalty = Math.max(0, (12 - soil.topsoilDepthIn) * 3);
  if (depthPenalty > 0) {
    value -= depthPenalty;
    reasons.push(`Topsoil is only ${soil.topsoilDepthIn} in deep, thinner than the 12 in benchmark.`);
  }

  const slopePenalty = Math.max(0, (soil.slopePct - 3) * 2.5);
  if (slopePenalty > 0) {
    value -= slopePenalty;
    reasons.push(`Slope of ${soil.slopePct}% raises runoff and erosion risk.`);
  }

  const erosionPenalty = EROSION_PENALTY[soil.erosionClass] ?? 0;
  if (erosionPenalty > 0) {
    value -= erosionPenalty;
    reasons.push(`Erosion class is rated "${soil.erosionClass}".`);
  }

  const cornStreak = continuousCornYears(cropHistory);
  const cornPenalty = Math.min(25, Math.max(0, cornStreak - 1) * 6);
  if (cornPenalty > 0) {
    reasons.push(`${cornStreak} straight years of corn are drawing down organic matter faster than it rebuilds.`);
    value -= cornPenalty;
  }

  if (reasons.length === 0) {
    reasons.push('Soil and rotation history both look within healthy ranges.');
  }

  value = Math.max(0, Math.min(100, Math.round(value)));

  return { value, label: labelFor(value), reasons };
}

export function drainagePenaltyNote(drainage: SoilProfile['drainageClass']): string | null {
  if (drainage === 'Somewhat excessively drained') {
    return 'Fast drainage means less water and nutrient holding capacity between rains.';
  }
  if (drainage === 'Poorly drained') {
    return 'Slow drainage raises the risk of ponding and delayed planting.';
  }
  return null;
}

import type { Confidence, ConfidenceLevel, Measured, Tier } from '../types.js';

// Placeholder values from the spec's Tiers sheet, pending agronomist calibration.
// farmer_entry isn't a spec tier: 0.7 matches how the spec's Confidence_Calculator
// scores farmer-entered rotation and yield goal.
const TIER_BASE: Record<Tier, number> = {
  lab: 1,
  field_test: 0.7,
  auto: 0.6,
  field_kit: 0.5,
  observation: 0.35,
  farmer_entry: 0.7,
};

// Placeholder values from the spec's Confidence_Rules sheet.
export const CONFIDENCE_RULES = {
  ageThresholdYears: 3,
  agePenaltyFactor: 0.8,
  missingMethodPenaltyFactor: 0.7,
  highThreshold: 0.8,
  mediumThreshold: 0.5,
};

const TESTED_TIERS = new Set<Tier>(['lab', 'field_test', 'field_kit']);
const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

export function inputConfidence(input: Measured<unknown>, asOf: Date = new Date()): number {
  let confidence = TIER_BASE[input.tier];

  if (input.sampleDate) {
    const ageYears = (asOf.getTime() - new Date(input.sampleDate).getTime()) / MS_PER_YEAR;
    if (ageYears > CONFIDENCE_RULES.ageThresholdYears) {
      confidence *= CONFIDENCE_RULES.agePenaltyFactor;
    }
  }

  const missingUnit = typeof input.value === 'number' && !input.unit;
  if (TESTED_TIERS.has(input.tier) && (!input.method || missingUnit)) {
    confidence *= CONFIDENCE_RULES.missingMethodPenaltyFactor;
  }

  return confidence;
}

export function levelFor(value: number): ConfidenceLevel {
  if (value >= CONFIDENCE_RULES.highThreshold) return 'High';
  if (value >= CONFIDENCE_RULES.mediumThreshold) return 'Medium';
  return 'Low';
}

// `adjustment` is the location adjustment in percentage points (see locationConfidence.ts).
export function combineConfidence(
  inputs: Measured<unknown>[],
  adjustment = 0,
  asOf: Date = new Date(),
): Confidence {
  const total = inputs.reduce((sum, input) => sum + inputConfidence(input, asOf), 0);
  const adjusted = Math.min(0.99, Math.max(0.05, total / inputs.length + adjustment / 100));
  // Round off float error so e.g. (0.7 + 0.7 + 1) / 3 lands on 0.8, not 0.7999…
  const value = Math.round(adjusted * 1e4) / 1e4;
  return { value, level: levelFor(value) };
}

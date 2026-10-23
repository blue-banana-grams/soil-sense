import type { FieldRecord, Measured, Recommendation, RotationPlan } from '../types.js';
import { combineConfidence } from './confidence.js';
import { continuousCornYears } from './scoring.js';

// Placeholders: the spec's source gives no pH targets or nitrogen rates. Replace
// with Iowa State guidance (e.g. PM 1688, MRTN) before anyone acts on them.
const PH_ACIDIC_BELOW = 6.0;
const PH_ALKALINE_ABOVE = 7.3;
const LB_N_PER_BU_GOAL = { low: 1.0, high: 1.2 };
const SOYBEAN_N_CREDIT_LB = 50;

function limeRate(field: FieldRecord): Recommendation {
  const missing = ['Lab buffer pH'];
  if (field.soil.ph.tier !== 'lab') missing.unshift('Lab soil pH');
  return {
    id: 'lime_rate',
    title: 'Lime rate',
    status: 'needs_data',
    advice: 'No lime rate without a lab soil test that includes buffer pH.',
    confidence: null,
    missing,
    improvesWith: [],
  };
}

function phosphorusPotassiumRate(): Recommendation {
  return {
    id: 'phosphorus_potassium_rate',
    title: 'Phosphorus & potassium rate',
    status: 'needs_data',
    advice: 'No phosphorus or potassium rate without a lab soil test.',
    confidence: null,
    missing: ['Lab phosphorus test (with test method)', 'Lab potassium test (with test method)'],
    improvesWith: [],
  };
}

function nextCornYear(
  field: FieldRecord,
  rotation: RotationPlan,
): { year: number; precedingCrop: string | null } | null {
  const history = [...field.cropHistory.value].sort((a, b) => a.year - b.year);
  const lastYear = history.at(-1)?.year ?? 0;
  const cashCrops = [...history, ...rotation.years.filter((y) => Number.isInteger(y.year))];
  const index = cashCrops.findIndex((c) => c.year > lastYear && c.crop === 'Corn');
  if (index < 0) return null;
  return {
    year: cashCrops[index].year,
    precedingCrop: index > 0 ? cashCrops[index - 1].crop : null,
  };
}

function nitrogenPlan(field: FieldRecord, rotation: RotationPlan): Recommendation {
  const { cropHistory, management, soil } = field;
  const improvesWith = ['Nitrate-N test'];
  if (!management.amendments) improvesWith.push('Fertilizer, manure, compost, lime applied');

  const missing: string[] = [];
  if (cropHistory.value.length === 0) missing.push('Crop rotation (last 3 years)');
  if (!management.yieldGoalBuAc) missing.push('Yield goal');

  if (missing.length > 0 || !management.yieldGoalBuAc) {
    return {
      id: 'nitrogen_plan',
      title: 'Nitrogen plan',
      status: 'needs_data',
      advice: 'Add your yield goal to get a nitrogen range for next corn crop.',
      confidence: null,
      missing,
      improvesWith,
    };
  }

  const goal = management.yieldGoalBuAc.value;
  const nextCorn = nextCornYear(field, rotation);
  const afterSoybeans = nextCorn?.precedingCrop === 'Soybeans';
  const credit = afterSoybeans ? SOYBEAN_N_CREDIT_LB : 0;

  // Only count what was applied after the prior crop's harvest, for this corn crop.
  const creditFrom = nextCorn ? `${nextCorn.year - 1}-08-01` : '';
  const amendments = (management.amendments?.value ?? []).filter((a) => a.date >= creditFrom);
  const appliedN = amendments
    .filter((a) => a.unit === 'lb N/ac')
    .reduce((sum, a) => sum + a.rate, 0);
  const uncredited = amendments.filter((a) => a.unit !== 'lb N/ac').map((a) => a.product);

  const low = Math.max(0, Math.round(goal * LB_N_PER_BU_GOAL.low - credit - appliedN));
  const high = Math.max(0, Math.round(goal * LB_N_PER_BU_GOAL.high - credit - appliedN));

  const cropLabel = nextCorn ? `${nextCorn.year} corn` : 'corn';
  const parts = [`Estimate for ${cropLabel}: ${low}–${high} lb N/ac more for a ${goal} bu/ac goal`];
  if (afterSoybeans) parts.push(`after a ${SOYBEAN_N_CREDIT_LB} lb soybean credit`);
  if (appliedN > 0) parts.push(`minus ${appliedN} lb already applied`);
  let advice = parts.join(', ') + '.';
  if (uncredited.length > 0) {
    advice += ` Not credited (needs a nutrient analysis): ${uncredited.join(', ')}.`;
  }

  const inputs: Measured<unknown>[] = [cropHistory, management.yieldGoalBuAc, soil.organicMatterPct];
  if (management.amendments) inputs.push(management.amendments);
  const computed = combineConfidence(inputs);
  // Spec rule: without a nitrate test, the range is labeled low confidence.
  const confidence = { ...computed, level: 'Low' as const };

  return {
    id: 'nitrogen_plan',
    title: 'Nitrogen plan',
    status: 'ready',
    advice,
    confidence,
    missing: [],
    improvesWith,
  };
}

function compaction(): Recommendation {
  return {
    id: 'compaction',
    title: 'Compaction',
    status: 'needs_data',
    advice: 'Dig with a spade or push a penetrometer and note the depth where resistance jumps.',
    confidence: null,
    missing: ['Compaction layer depth, or ponding / slow spring drying'],
    improvesWith: ['Root condition', 'Soil smell', 'Bulk density'],
  };
}

function structureAndOrganicMatter(field: FieldRecord): Recommendation {
  const { cropHistory, management, soil } = field;
  const improvesWith = ['Aggregate stability', 'Infiltration time', 'Earthworm count'];
  const tillage = management.tillage;

  if (!tillage || cropHistory.value.length === 0) {
    const missing: string[] = [];
    if (!tillage) missing.push('Tillage type and depth');
    if (cropHistory.value.length === 0) missing.push('Crop rotation (last 3 years)');
    return {
      id: 'structure_organic_matter',
      title: 'Structure & organic matter',
      status: 'needs_data',
      advice: 'Add your tillage type to get structure and organic matter advice.',
      confidence: null,
      missing,
      improvesWith,
    };
  }

  const steepSlope = soil.slopePct.value > 5;
  const actions: string[] = [];
  if (tillage.value.type === 'conventional') {
    actions.push('Cut tillage passes and move toward reduced or no-till to keep residue on the surface.');
  } else if (tillage.value.type === 'reduced') {
    actions.push(
      steepSlope
        ? 'Move to no-till on this slope to hold soil in place.'
        : 'Keep residue on the surface; no-till would build organic matter further.',
    );
  } else {
    actions.push('Keep no-till: it is protecting your topsoil.');
  }
  if (!cropHistory.value.some((c) => c.crop === 'Cover crop')) {
    actions.push('Add a cover crop after harvest.');
  }
  if (continuousCornYears(cropHistory.value) > 1) {
    actions.push('Rotate out of continuous corn.');
  }

  return {
    id: 'structure_organic_matter',
    title: 'Structure & organic matter',
    status: 'ready',
    advice: actions.join(' '),
    confidence: combineConfidence([tillage, cropHistory, soil.organicMatterPct]),
    missing: [],
    improvesWith,
  };
}

function phDirection(field: FieldRecord): Recommendation {
  const { ph } = field.soil;
  let advice: string;
  if (ph.value < PH_ACIDIC_BELOW) {
    advice = `pH ${ph.value} reads acidic. Confirm with a lab test before liming.`;
  } else if (ph.value > PH_ALKALINE_ABOVE) {
    advice = `pH ${ph.value} reads alkaline. Do not lime; confirm with a lab test.`;
  } else {
    advice = `pH ${ph.value} reads near optimal.`;
  }
  return {
    id: 'ph_direction',
    title: 'pH direction',
    status: 'ready',
    advice,
    confidence: combineConfidence([ph]),
    missing: [],
    improvesWith: ph.tier === 'lab' ? [] : ['Lab soil pH'],
  };
}

export function buildRecommendations(
  field: FieldRecord,
  rotation: RotationPlan,
): Recommendation[] {
  return [
    structureAndOrganicMatter(field),
    nitrogenPlan(field, rotation),
    phDirection(field),
    compaction(),
    limeRate(field),
    phosphorusPotassiumRate(),
  ];
}

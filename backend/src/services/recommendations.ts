import type { FieldRecord, Measured, Recommendation, RotationPlan } from '../types.js';
import { combineConfidence } from './confidence.js';
import { continuousCornYears } from './scoring.js';
import { PH_ACIDIC_BELOW, PH_ALKALINE_ABOVE } from './thresholds.js';

// The spec forbids calculating a nitrogen rate without a validated regional
// method and its mandatory inputs. None is wired in yet, so the nitrogen plan
// gives general guidance only and doesn't count toward completeness.
export const NITROGEN_METHOD_AVAILABLE = false;

const isLab = (m: Measured<unknown> | undefined): m is Measured<unknown> => m?.tier === 'lab';

function limeRate(field: FieldRecord, adjustment: number): Recommendation {
  const { ph, bufferPh } = field.soil;
  const missing: string[] = [];
  if (!isLab(ph)) missing.push('Lab soil pH');
  if (!isLab(bufferPh)) missing.push('Lab buffer pH');

  if (missing.length > 0 || !ph || !bufferPh) {
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
  return {
    id: 'lime_rate',
    title: 'Lime rate',
    status: 'ready',
    advice:
      ph.value >= PH_ACIDIC_BELOW
        ? `Lab pH ${ph.value} doesn't call for lime right now.`
        : `Lab pH ${ph.value}, buffer pH ${bufferPh.value}. Use the lime rate on your lab report; SoilSense doesn't calculate lime rates yet.`,
    confidence: combineConfidence([ph, bufferPh], adjustment),
    missing: [],
    improvesWith: [],
  };
}

function phosphorusPotassiumRate(field: FieldRecord, adjustment: number): Recommendation {
  const { phosphorusPpm: p, potassiumPpm: k } = field.soil;
  // Spec gate: phosphorus (lab), potassium (lab) and the phosphorus test method.
  if (!p || !k || !p.method) {
    return {
      id: 'phosphorus_potassium_rate',
      title: 'Phosphorus & potassium rate',
      status: 'needs_data',
      advice: 'No phosphorus or potassium rate without a lab soil test.',
      confidence: null,
      missing: [
        ...(p ? [] : ['Lab phosphorus test']),
        ...(p && !p.method ? ['Phosphorus test method (on your lab report)'] : []),
        ...(k ? [] : ['Lab potassium test']),
      ],
      improvesWith: [],
    };
  }
  return {
    id: 'phosphorus_potassium_rate',
    title: 'Phosphorus & potassium rate',
    status: 'ready',
    advice: `Phosphorus ${p.value} ppm (${p.method}), potassium ${k.value} ppm. Use the rates on your lab report or your state's extension tables; SoilSense doesn't calculate P and K rates yet.`,
    confidence: combineConfidence([p, k], adjustment),
    missing: [],
    improvesWith: [],
  };
}

// The next corn year in the plan and the cash crop right before it.
function nextCorn(field: FieldRecord, rotation: RotationPlan): { year: number; precedingCrop: string } | null {
  const history = [...field.cropHistory.value].sort((a, b) => a.year - b.year);
  const planned = rotation.years.filter((y) => Number.isInteger(y.year));
  const firstPlanned = planned[0]?.year ?? Infinity;
  const cashCrops = [...history.filter((h) => h.year < firstPlanned), ...planned];
  const index = cashCrops.findIndex((c) => c.year >= firstPlanned && c.crop === 'Corn');
  return index > 0 ? { year: cashCrops[index].year, precedingCrop: cashCrops[index - 1].crop } : null;
}

// General guidance only (spec Recommendation_Gates): no rate and no credits.
function nitrogenPlan(field: FieldRecord, rotation: RotationPlan): Recommendation {
  const corn = nextCorn(field, rotation);
  const guidance: string[] = [
    "SoilSense doesn't calculate nitrogen rates yet; that needs a validated method for your region, like your state extension's nitrogen calculator.",
  ];
  if (corn?.precedingCrop === 'Soybeans') {
    guidance.push(`Your plan puts corn after soybeans in ${corn.year}, which usually needs less nitrogen than corn after corn; your state's method sets how much.`);
  } else if (corn?.precedingCrop === 'Corn') {
    guidance.push(`Your plan has corn after corn in ${corn.year}, which usually needs more nitrogen than corn after soybeans.`);
  }
  guidance.push('Splitting nitrogen between planting and a sidedress around V6 lowers the risk of losing it.');

  return {
    id: 'nitrogen_plan',
    title: 'Nitrogen plan',
    status: 'needs_data',
    advice: guidance.join(' '),
    confidence: null,
    missing: [],
    improvesWith: [],
  };
}

const PONDING_ADVICE = {
  often:
    'Ponding and slow spring drying point to compaction or poor drainage. Dig with a spade in a wet spot and look for a hard layer; limit traffic when soil is wet.',
  sometimes:
    'Occasional ponding can mean a compacted layer in the wettest spots. Check those with a spade or penetrometer.',
  never:
    "No sign of drainage trouble. Still check headlands and wheel tracks with a spade, where traffic compacts soil most.",
} as const;

function compaction(field: FieldRecord, adjustment: number): Recommendation {
  const ponding = field.management.pondingOrSlowDrying;
  const improvesWith = ['Compaction layer depth (spade or penetrometer)', 'Root condition', 'Soil smell', 'Bulk density'];
  if (!ponding) {
    return {
      id: 'compaction',
      title: 'Compaction',
      status: 'needs_data',
      advice: 'Tell us whether water ponds or the field dries slowly in spring, or check for a hard layer with a spade.',
      confidence: null,
      missing: ['Ponding / slow spring drying, or compaction layer depth'],
      improvesWith,
    };
  }
  return {
    id: 'compaction',
    title: 'Compaction',
    status: 'ready',
    advice: PONDING_ADVICE[ponding.value],
    confidence: combineConfidence([ponding, field.soil.drainageClass], adjustment),
    missing: [],
    improvesWith,
  };
}

function structureAndOrganicMatter(field: FieldRecord, adjustment: number): Recommendation {
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
      advice: 'Tell us how you till to get structure and organic matter advice.',
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
  actions.push('Add a cover crop after harvest.');
  if (continuousCornYears(cropHistory.value) > 1) {
    actions.push('Rotate out of continuous corn.');
  }

  return {
    id: 'structure_organic_matter',
    title: 'Structure & organic matter',
    status: 'ready',
    advice: actions.join(' '),
    confidence: combineConfidence([tillage, cropHistory, soil.organicMatterPct], adjustment),
    missing: [],
    improvesWith,
  };
}

// Spec: a screening flag only, and only from a lab test (or a field kit with method recorded).
function phDirection(field: FieldRecord, adjustment: number): Recommendation {
  const { ph } = field.soil;
  if (!ph || ph.tier !== 'lab') {
    const mapped = ph ? ` USDA soil maps put typical pH for this soil around ${ph.value}, but that's an area average.` : '';
    return {
      id: 'ph_direction',
      title: 'pH check',
      status: 'needs_data',
      advice: `A pH flag needs a test of your own soil.${mapped}`,
      confidence: null,
      missing: ['Soil pH from a lab test'],
      improvesWith: [],
    };
  }
  let flag: string;
  if (ph.value < PH_ACIDIC_BELOW) flag = `Lab pH ${ph.value} reads acidic for corn.`;
  else if (ph.value > PH_ALKALINE_ABOVE) flag = `Lab pH ${ph.value} reads alkaline; lime won't help.`;
  else flag = `Lab pH ${ph.value} reads near optimal for corn.`;
  return {
    id: 'ph_direction',
    title: 'pH check',
    status: 'ready',
    advice: `${flag} This is a screening flag; a lime decision needs your lab's recommendation.`,
    confidence: combineConfidence([ph], adjustment),
    missing: [],
    improvesWith: [],
  };
}

export function buildRecommendations(
  field: FieldRecord,
  rotation: RotationPlan,
  confidenceAdjustment = 0,
): Recommendation[] {
  return [
    structureAndOrganicMatter(field, confidenceAdjustment),
    compaction(field, confidenceAdjustment),
    phDirection(field, confidenceAdjustment),
    limeRate(field, confidenceAdjustment),
    phosphorusPotassiumRate(field, confidenceAdjustment),
    nitrogenPlan(field, rotation),
  ];
}

export function completeness(recommendations: Recommendation[]): { ready: number; total: number } {
  const counted = recommendations.filter((r) => NITROGEN_METHOD_AVAILABLE || r.id !== 'nitrogen_plan');
  return { ready: counted.filter((r) => r.status === 'ready').length, total: counted.length };
}

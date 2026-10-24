import type { ClimateSummary, ConfidenceFactor, CropHistoryEntry } from '../types.js';
import { isNonFarmLand } from './cropscape.js';

// Placeholder cutoffs and weights (percentage points), pending agronomist calibration.
const RAIN_STEADY_BELOW_PCT = 20;
const RAIN_ERRATIC_ABOVE_PCT = 30;
const IRRIGATED_MOSTLY_PCT = 50;
const IRRIGATED_SOME_PCT = 15;
const CORN_FROST_FREE_DAYS = 130; // spec Corn_Reference sheet

export interface LocationSignals {
  // null when the crop-history service couldn't be reached.
  cropHistory: CropHistoryEntry[] | null;
  climate: ClimateSummary | null;
  irrigatedCornSharePct: number | null;
  irrigationWithheld: boolean;
  countyName: string;
}

function cropFactor(history: CropHistoryEntry[] | null): ConfidenceFactor {
  if (history === null) {
    return {
      label: 'Crop history',
      detail: "Couldn't load satellite crop records, so your rotation is a guess.",
      effect: -10,
    };
  }
  const nonFarmYears = history.filter((h) => isNonFarmLand(h.crop)).length;
  if (nonFarmYears >= Math.ceil(history.length / 2)) {
    return {
      label: 'Land use',
      detail: 'Satellite records show this spot is mostly not cropland. Move the pin onto your field.',
      effect: -15,
    };
  }
  const crops = [...new Set(history.map((h) => h.crop))].join(', ');
  return {
    label: 'Crop history',
    detail: `Satellite records show what grew here for ${history.length} years (${crops}).`,
    effect: 0,
  };
}

function rainFactor(climate: ClimateSummary | null): ConfidenceFactor {
  if (!climate) {
    return { label: 'Weather', detail: "Couldn't load weather history for this spot.", effect: -5 };
  }
  const cv = climate.rainVariabilityPct;
  if (cv < RAIN_STEADY_BELOW_PCT) {
    return {
      label: 'Weather',
      detail: `Growing-season rain here is steady from year to year (about ±${cv}%), so yields are easier to predict.`,
      effect: 5,
    };
  }
  if (cv > RAIN_ERRATIC_ABOVE_PCT) {
    return {
      label: 'Weather',
      detail: `Growing-season rain here swings a lot from year to year (about ±${cv}%), so yields are harder to predict.`,
      effect: -5,
    };
  }
  return {
    label: 'Weather',
    detail: `Growing-season rain here varies about ±${cv}% from year to year, typical for farm country.`,
    effect: 0,
  };
}

function irrigationFactor(pct: number | null, withheld: boolean, countyName: string): ConfidenceFactor {
  if (pct === null && withheld) {
    return {
      label: 'Irrigation',
      detail: `USDA keeps ${countyName}'s irrigated acres private to protect individual farms, which usually means only a few farms irrigate. Yields here likely ride on rainfall.`,
      effect: 0,
    };
  }
  if (pct === null) {
    return { label: 'Irrigation', detail: `Irrigation figures for ${countyName} aren't available right now.`, effect: 0 };
  }
  if (pct >= IRRIGATED_MOSTLY_PCT) {
    return {
      label: 'Irrigation',
      detail: `About ${pct}% of corn in ${countyName} is irrigated, so dry spells matter less.`,
      effect: 5,
    };
  }
  if (pct >= IRRIGATED_SOME_PCT) {
    return { label: 'Irrigation', detail: `About ${pct}% of corn in ${countyName} is irrigated.`, effect: 2 };
  }
  // A share that rounds to 0% still means a handful of irrigated acres, so don't say "0%".
  const share = pct === 0 ? 'Almost none of the corn' : `Only about ${pct}% of corn`;
  return {
    label: 'Irrigation',
    detail: `${share} in ${countyName} is irrigated, so yields here ride on rainfall.`,
    effect: 0,
  };
}

function seasonFactor(climate: ClimateSummary): ConfidenceFactor {
  const days = climate.frostFreeDays.p50;
  if (days < CORN_FROST_FREE_DAYS) {
    return {
      label: 'Season length',
      detail: `A typical frost-free season here is ${days} days, shorter than the ${CORN_FROST_FREE_DAYS} corn usually needs. Pick an early hybrid.`,
      effect: -5,
    };
  }
  return {
    label: 'Season length',
    detail: `A typical frost-free season here is ${days} days, enough for corn.`,
    effect: 0,
  };
}

export function locationFactors(signals: LocationSignals): ConfidenceFactor[] {
  const factors = [
    cropFactor(signals.cropHistory),
    rainFactor(signals.climate),
    irrigationFactor(signals.irrigatedCornSharePct, signals.irrigationWithheld, signals.countyName),
  ];
  if (signals.climate) factors.push(seasonFactor(signals.climate));
  return factors;
}

export function totalAdjustment(factors: ConfidenceFactor[]): number {
  return factors.reduce((sum, f) => sum + f.effect, 0);
}

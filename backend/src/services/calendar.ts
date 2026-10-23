import type { SeasonCalendar } from '../types.js';

// Placeholder season calendar for Story County, IA corn, based on typical
// soil-temperature and frost-date benchmarks for the area. Swap the static
// dates below for a real calc against Open-Meteo historical + forecast data
// (soil temp hits ~50°F, base-50°F GDD accumulation to each growth stage)
// once the weather service is wired up.
export function buildSeasonCalendar(year: number): SeasonCalendar {
  return {
    plantingWindow: { start: `${year}-04-25`, end: `${year}-05-15` },
    growthStages: [
      { stage: 'Emergence (VE)', gddThreshold: 100, estDate: `${year}-05-05` },
      { stage: 'Six-leaf (V6)', gddThreshold: 475, estDate: `${year}-06-05` },
      { stage: 'Tasseling (VT)', gddThreshold: 1400, estDate: `${year}-07-15` },
      { stage: 'Silking (R1)', gddThreshold: 1450, estDate: `${year}-07-18` },
      { stage: 'Maturity (R6)', gddThreshold: 2700, estDate: `${year}-09-15` },
    ],
    fertilizerTiming: 'Split nitrogen: about a third at planting, the rest sidedressed at V6.',
    harvestWindow: { start: `${year}-09-25`, end: `${year}-10-20` },
    coverCropWindow: { start: `${year}-09-10`, end: `${year}-10-05` },
  };
}

import type { CurrentConditions, ThisWeek } from '../types.js';
import { isoFromDoy, seasonDates, todayDoy } from './calendar.js';
import type { Climate } from './weather.js';

const PLANTING_SOIL_F = 50;
const FALL_N_SOIL_F = 50;
const HEAVY_RAIN_IN = 1;
const HARD_FREEZE_F = 28;
const PREP_DAYS = 45;
const STAGE_NAMES = ['emergence', 'six-leaf (V6)', 'tasseling', 'silking', 'maturity'];

const monthDay = (year: number, doy: number) =>
  new Date(`${isoFromDoy(year, doy)}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });

export function buildThisWeek(
  climate: Climate,
  todayIso: string,
  current: CurrentConditions | null,
  nextCrop: string | null,
): ThisWeek | null {
  if (!current) return null;
  const year = Number(todayIso.slice(0, 4));
  const today = todayDoy(todayIso);
  const d = seasonDates(climate);
  const soil = current.soilTempF;
  const items: string[] = [];
  let headline: string;
  let frostMatters = false;

  if (today >= d.plantStart - PREP_DAYS && today < d.plantStart) {
    headline = 'Getting ready to plant';
    items.push(`Corn planting usually opens around ${monthDay(year, d.plantStart)} here.`);
    if (soil !== null) {
      items.push(
        soil >= PLANTING_SOIL_F
          ? `Soil is already ${soil}°F, warm for this time of year. Watch for a late frost before planting.`
          : `Soil is ${soil}°F. Corn needs about ${PLANTING_SOIL_F}°F to germinate well.`,
      );
    }
    frostMatters = true;
  } else if (today >= d.plantStart && today <= d.plantEnd) {
    headline = 'Planting time';
    if (soil !== null) {
      items.push(
        soil >= PLANTING_SOIL_F
          ? `Soil is ${soil}°F, warm enough to plant corn.`
          : `Soil is ${soil}°F. Wait until it holds at ${PLANTING_SOIL_F}°F before planting corn.`,
      );
    }
    items.push(`The planting window here usually runs until about ${monthDay(year, d.plantEnd)}.`);
    frostMatters = true;
  } else if (today > d.plantEnd && today < (d.maturity ?? d.harvestStart)) {
    headline = 'Growing season';
    const reached = d.stageDoys.filter((s): s is number => s !== null && s <= today).length;
    const stage = reached > 0 ? STAGE_NAMES[reached - 1] : 'emergence';
    items.push(`Corn planted on time here is usually past ${stage} by now.`);
    const v6 = d.stageDoys[1];
    if (v6 !== null && Math.abs(today - v6) <= 10) {
      items.push('Around V6 is the time to sidedress the rest of your nitrogen.');
    }
    frostMatters = true;
  } else if (today >= (d.maturity ?? d.harvestStart) && today <= d.coverCropEnd + 30) {
    headline = 'Harvest and fall work';
    if (today <= d.harvestEnd) items.push(`Harvest usually wraps up by about ${monthDay(year, d.harvestEnd)} here.`);
    items.push(
      today <= d.coverCropEnd
        ? `Seed a cover crop right after harvest. The window usually closes around ${monthDay(year, d.coverCropEnd)}.`
        : 'It is late for most cover crops; winter cereal rye is the one that can still go in.',
    );
    if (soil !== null) {
      items.push(
        soil >= FALL_N_SOIL_F
          ? `Soil is ${soil}°F. If you apply fall nitrogen, wait until it stays below ${FALL_N_SOIL_F}°F so less is lost.`
          : `Soil is ${soil}°F, cool enough that fall nitrogen is less likely to be lost. Spring or split applications still lose less.`,
      );
    }
  } else {
    headline = 'Off-season planning';
    items.push('A lab soil test now gives you numbers to plan next season with, and raises your confidence here.');
    if (nextCrop) items.push(`Your plan says ${nextCrop.toLowerCase()} next. Line up seed before spring.`);
    items.push(`Corn planting usually opens around ${monthDay(year, d.plantStart)} here.`);
  }

  if (current.next7.rainIn >= HEAVY_RAIN_IN) {
    items.push(
      `About ${current.next7.rainIn} in. of rain is forecast this week. Hold off on spreading fertilizer or manure, especially on slopes.`,
    );
  }
  if (frostMatters && current.next7.lowF <= HARD_FREEZE_F) {
    items.push(`A hard freeze is possible this week (low around ${current.next7.lowF}°F).`);
  }

  return { headline, items, conditions: current };
}

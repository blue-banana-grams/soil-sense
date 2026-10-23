import type { FieldRecord, RotationPlan } from '../types.js';
import { continuousCornYears } from './scoring.js';

export function planRotation(field: FieldRecord): RotationPlan {
  const { soil, cropHistory, management } = field;
  const sorted = [...cropHistory.value].sort((a, b) => b.year - a.year);
  const lastCrop = sorted[0]?.crop ?? 'Corn';
  const lastYear = sorted[0]?.year ?? new Date().getFullYear();
  const cornStreak = continuousCornYears(cropHistory.value);

  const lowOrganicMatter = soil.organicMatterPct.value < 3.5;
  const steepSlope = soil.slopePct.value > 5;
  const alreadyNoTill = management.tillage?.value.type === 'none';
  const needsCoverCrop = lowOrganicMatter || steepSlope;

  const years: RotationPlan['years'] = [];
  let nextCrop = lastCrop === 'Corn' ? 'Soybeans' : 'Corn';

  for (let i = 0; i < 4; i++) {
    const year = lastYear + i + 1;
    const crop = nextCrop;
    let why: string;

    if (crop === 'Soybeans') {
      why =
        cornStreak > 1 && i === 0
          ? `Breaks ${cornStreak} straight years of corn and fixes nitrogen for the corn crop after it.`
          : 'Fixes nitrogen in the soil and breaks corn pest and disease cycles.';
    } else {
      why = 'Follows soybeans, so less starter nitrogen is needed.';
    }

    years.push({ year, crop, why });

    if (needsCoverCrop && i === 1) {
      years.push({
        year: year + 0.5,
        crop: 'Cover crop',
        why: steepSlope
          ? 'Interseeded that fall — steep slope needs roots in the ground off-season to hold topsoil.'
          : 'Interseeded that fall — low organic matter benefits from a cover crop to rebuild it between cash crops.',
      });
    }

    nextCrop = crop === 'Corn' ? 'Soybeans' : 'Corn';
  }

  const summaryParts: string[] = [];
  if (cornStreak > 1) {
    summaryParts.push(`Move off continuous corn (${cornStreak} years) into a corn-soybean rotation`);
  } else {
    summaryParts.push('Keep alternating corn and soybeans');
  }
  if (needsCoverCrop) {
    summaryParts.push('add a cover crop year to protect and rebuild topsoil');
  }
  if (steepSlope) {
    summaryParts.push(
      alreadyNoTill
        ? 'keep no-till to hold soil on the slope'
        : 'pair with no-till to cut erosion on the slope',
    );
  }

  return {
    summary: summaryParts.join('; ') + '.',
    years: years.slice(0, 5),
  };
}

import type { TopsoilScore } from '../types';

export function scoreColor(value: number): string {
  if (value >= 75) return '#2A1B12'; // soil-dark: healthy topsoil
  if (value >= 55) return '#4A2E1C'; // topsoil
  if (value >= 35) return '#8A5A3B'; // subsoil
  if (value >= 20) return '#C49A6C'; // clay
  return '#E3CFA8'; // sand: depleted
}

export const SCORE_MEANING: Record<TopsoilScore['label'], string> = {
  Healthy: 'Topsoil is holding up well. Keep doing what you are doing.',
  Watch: 'Starting to thin. Small changes now will pay off.',
  'At risk': 'Losing topsoil. Worth acting on this season.',
  Depleted: 'Topsoil is badly worn. Rebuilding it is the priority.',
};
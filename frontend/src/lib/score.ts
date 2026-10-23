export function scoreColor(value: number): string {
  if (value >= 75) return '#2A1B12'; // soil-dark: healthy topsoil
  if (value >= 55) return '#4A2E1C'; // topsoil
  if (value >= 35) return '#8A5A3B'; // subsoil
  if (value >= 20) return '#C49A6C'; // clay
  return '#E3CFA8'; // sand: depleted
}

export function scoreLabel(value: number): string {
  if (value >= 75) return 'Healthy';
  if (value >= 55) return 'Watch';
  if (value >= 35) return 'At risk';
  return 'Depleted';
}

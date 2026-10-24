import type { Confidence, RotationPlan, TopsoilScore } from '../types.js';

// Template-based stand-in for the AI explanation. Swap the body for a real LLM
// call (pass in the report as context) once an API key is wired up.
export function explainField(
  place: string,
  score: TopsoilScore,
  rotation: RotationPlan,
  confidence: Confidence,
): string {
  const scoreLine =
    score.label === 'Healthy'
      ? `The topsoil at your spot near ${place} looks healthy: ${score.value}/100.`
      : `The topsoil at your spot near ${place} is showing stress: ${score.value}/100 (${score.label.toLowerCase()}).`;

  const nextYear = rotation.years[0];
  const actionLine = nextYear
    ? `Plant ${nextYear.crop.toLowerCase()} in ${nextYear.year}: ${nextYear.why.charAt(0).toLowerCase()}${nextYear.why.slice(1)}`
    : 'Stick with your current rotation.';

  const confidenceLine =
    confidence.level === 'High'
      ? 'We are fairly sure about this.'
      : 'This is based mostly on USDA maps and satellite records. Telling us about your field will sharpen it.';

  return `${scoreLine} ${actionLine} ${confidenceLine}`;
}

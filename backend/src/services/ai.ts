import type { FieldRecord, RotationPlan, TopsoilScore } from '../types.js';

// Template-based stand-in for the AI explanation. Swap the body of this
// function for a real call to an LLM (pass in score + rotation + field as
// context) once an API key is wired up; keep the signature the same so the
// route doesn't need to change.
export function explainField(
  field: FieldRecord,
  score: TopsoilScore,
  rotation: RotationPlan,
): string {
  const nextYear = rotation.years[0];
  const scoreLine =
    score.label === 'Healthy'
      ? `${field.name} is in good shape — a ${score.value}/100 topsoil score.`
      : `${field.name} is showing signs of soil stress — a ${score.value}/100 topsoil score (${score.label.toLowerCase()}).`;

  const actionLine = nextYear
    ? `Plant ${nextYear.crop} in ${nextYear.year}: ${nextYear.why.toLowerCase()}`
    : 'Stick with the current rotation.';

  return `${scoreLine} ${actionLine}`;
}

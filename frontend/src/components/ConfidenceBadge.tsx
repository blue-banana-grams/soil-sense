import type { Confidence } from '../types';

const LEVEL_STYLE: Record<Confidence['level'], string> = {
  High: 'bg-field-green text-cream',
  Medium: 'bg-corn-yellow text-soil-dark',
  Low: 'bg-rust text-cream',
};

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${LEVEL_STYLE[confidence.level]}`}
      title={`Confidence ${Math.round(confidence.value * 100)}%`}
    >
      {confidence.level} confidence
    </span>
  );
}

import type { TopsoilScore } from '../types';
import { SCORE_MEANING, scoreColor } from '../lib/score';
import { ConfidenceBadge } from './ConfidenceBadge';

export function ScoreCard({ score }: { score: TopsoilScore }) {
  const lightFill = score.value < 35;

  return (
    <div className="rounded-2xl border border-clay/40 bg-cream p-4">
      <div className="flex items-center gap-4">
        <div
          className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full ring-4 ring-sand"
          style={{ backgroundColor: scoreColor(score.value), color: lightFill ? '#2A1B12' : '#F6EFE1' }}
        >
          <span className="text-3xl font-bold leading-none">{score.value}</span>
          <span className="text-xs opacity-80">of 100</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium uppercase tracking-wide text-topsoil/60">Topsoil health</p>
          <p className="font-heading text-2xl leading-tight">{score.label}</p>
          <div className="mt-1">
            <ConfidenceBadge confidence={score.confidence} />
          </div>
        </div>
      </div>
      <p className="mt-3 text-base font-medium">{SCORE_MEANING[score.label]}</p>
      <p className="mt-3 text-sm font-medium text-topsoil/70">Why this score</p>
      <ul className="mt-1.5 space-y-1.5 text-base text-soil-dark/90">
        {score.reasons.map((reason) => (
          <li key={reason} className="flex gap-2">
            <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-leaf" aria-hidden />
            <span>{reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

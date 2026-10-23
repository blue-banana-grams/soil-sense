import type { TopsoilScore } from '../types';
import { scoreColor } from '../lib/score';

export function ScoreCard({ score }: { score: TopsoilScore }) {
  return (
    <div className="rounded-xl border border-clay/40 bg-cream p-4">
      <div className="flex items-center gap-3">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-cream"
          style={{ backgroundColor: scoreColor(score.value) }}
        >
          {score.value}
        </div>
        <div>
          <p className="font-heading text-lg leading-tight">{score.label} topsoil</p>
          <p className="text-sm text-topsoil/70">Score out of 100</p>
        </div>
      </div>
      <ul className="mt-3 space-y-1.5 text-sm text-soil-dark/90">
        {score.reasons.map((reason, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-leaf">•</span>
            <span>{reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

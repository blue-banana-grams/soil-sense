import { ArrowDown, ArrowUp, ClipboardList, Minus } from 'lucide-react';
import type { OverallConfidence } from '../types';

const LEVEL_COLOR: Record<OverallConfidence['level'], string> = {
  High: '#33502A',
  Medium: '#E9B730',
  Low: '#C2542D',
};

interface ConfidenceCardProps {
  confidence: OverallConfidence;
  previous: OverallConfidence | null;
  canImprove: boolean;
  improveLabel: string;
  onImprove: () => void;
}

export function ConfidenceCard({ confidence, previous, canImprove, improveLabel, onImprove }: ConfidenceCardProps) {
  const pct = Math.round(confidence.value * 100);
  const prevPct = previous ? Math.round(previous.value * 100) : null;

  return (
    <section className="rounded-2xl border border-clay/40 bg-cream p-4 sm:p-5" aria-labelledby="confidence-title">
      <p id="confidence-title" className="text-sm font-medium uppercase tracking-wide text-topsoil/60">
        How sure we are
      </p>
      <div className="mt-1 flex items-baseline gap-3">
        <p className="font-heading text-3xl" style={{ color: LEVEL_COLOR[confidence.level] }}>
          {confidence.level}
        </p>
        <p className="text-2xl font-semibold">{pct}%</p>
      </div>
      <div
        className="mt-2 h-3 overflow-hidden rounded-full bg-sand/60"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label="Confidence"
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: LEVEL_COLOR[confidence.level] }}
        />
      </div>

      {prevPct !== null && prevPct !== pct && (
        <p className="mt-3 rounded-xl bg-field-green px-3 py-2 text-base font-medium text-cream" role="status">
          {pct > prevPct ? 'Up' : 'Down'} from {previous!.level} {prevPct}% with what you told us.
        </p>
      )}

      <p className="mt-4 text-sm font-medium text-topsoil/70">Why</p>
      <ul className="mt-1.5 space-y-2.5">
        {confidence.factors.map((f) => {
          const Icon = f.effect > 0 ? ArrowUp : f.effect < 0 ? ArrowDown : Minus;
          const tone = f.effect > 0 ? 'bg-field-green text-cream' : f.effect < 0 ? 'bg-rust text-cream' : 'bg-sand text-topsoil';
          return (
            <li key={f.label} className="flex gap-3">
              <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${tone}`}>
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </span>
              <span className="text-base">
                <span className="font-semibold">{f.label}.</span> {f.detail}
                {f.effect !== 0 && (
                  <span className="ml-1 text-sm font-medium text-topsoil/60">
                    ({f.effect > 0 ? '+' : ''}
                    {f.effect} pts)
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>

      {canImprove && (
        <button
          onClick={onImprove}
          className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-corn-yellow px-4 text-base font-semibold text-soil-dark shadow-sm hover:brightness-105"
        >
          <ClipboardList className="h-5 w-5" aria-hidden />
          {improveLabel}
        </button>
      )}
      {canImprove && (
        <p className="mt-2 text-center text-sm text-topsoil/70">
          A few questions about your field. Every one is optional.
        </p>
      )}
    </section>
  );
}

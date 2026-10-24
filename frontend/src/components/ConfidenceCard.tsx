import { ArrowDown, ArrowUp, ClipboardList, Minus } from 'lucide-react';
import type { OverallConfidence, Report } from '../types';

const LEVEL_COLOR: Record<OverallConfidence['level'], string> = {
  High: '#33502A',
  Medium: '#E9B730',
  Low: '#C2542D',
};

export interface Snapshot {
  confidence: OverallConfidence;
  completeness: Report['completeness'];
}

interface ConfidenceCardProps {
  current: Snapshot;
  previous: Snapshot | null;
  actionLabel: string;
  onAction: () => void;
}

function changeMessage(current: Snapshot, previous: Snapshot): string | null {
  const now = Math.round(current.confidence.value * 100);
  const before = Math.round(previous.confidence.value * 100);
  const unlocked = current.completeness.ready - previous.completeness.ready;
  const parts: string[] = [];
  if (now !== before) parts.push(`Confidence ${now > before ? 'up' : 'down'} from ${before}% to ${now}%`);
  if (unlocked > 0) parts.push(`${unlocked} more piece${unlocked === 1 ? '' : 's'} of advice unlocked`);
  if (parts.length === 0) return null;
  return `${parts.join('. ')}.`;
}

export function ConfidenceCard({ current, previous, actionLabel, onAction }: ConfidenceCardProps) {
  const { confidence, completeness } = current;
  const pct = Math.round(confidence.value * 100);
  const message = previous ? changeMessage(current, previous) : null;
  const done = completeness.ready === completeness.total;

  return (
    <section className="rounded-2xl border border-clay/40 bg-cream p-4 sm:p-5" aria-labelledby="confidence-title">
      <p id="confidence-title" className="text-sm font-medium uppercase tracking-wide text-topsoil/60">
        How sure we are
      </p>
      <p className="text-sm text-topsoil/70">How reliable the soil data behind your results is</p>
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

      {message && (
        <p className="mt-3 rounded-xl bg-field-green px-3 py-2 text-base font-medium text-cream" role="status">
          {message}
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

      <div className="mt-5 rounded-xl bg-sand/40 p-3">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-base font-semibold">Advice unlocked</p>
          <p className="text-base font-semibold">
            {completeness.ready} of {completeness.total}
          </p>
        </div>
        <div className="mt-2 flex gap-1" aria-hidden>
          {Array.from({ length: completeness.total }, (_, i) => (
            <span key={i} className={`h-2 flex-1 rounded-full ${i < completeness.ready ? 'bg-leaf' : 'bg-cream'}`} />
          ))}
        </div>
        {!done && (
          <p className="mt-2 text-sm text-topsoil/75">
            Answering a few questions unlocks more advice. A lab soil test also raises confidence.
          </p>
        )}
      </div>

      <button
        onClick={onAction}
        className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-corn-yellow px-4 text-base font-semibold text-soil-dark shadow-sm hover:brightness-105"
      >
        <ClipboardList className="h-5 w-5" aria-hidden />
        {actionLabel}
      </button>
      <p className="mt-2 text-center text-sm text-topsoil/70">Every question is optional.</p>
    </section>
  );
}

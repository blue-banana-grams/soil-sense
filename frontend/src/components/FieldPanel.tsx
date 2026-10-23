import type { FieldDetail } from '../types';
import { ScoreCard } from './ScoreCard';
import { RotationPlan } from './RotationPlan';
import { SeasonCalendar } from './SeasonCalendar';

interface FieldPanelProps {
  field: FieldDetail | null;
  loading: boolean;
  onClose: () => void;
}

export function FieldPanel({ field, loading, onClose }: FieldPanelProps) {
  const open = loading || field !== null;

  return (
    <aside
      className={`fixed inset-y-0 right-0 z-[1100] w-full max-w-md overflow-y-auto bg-cream shadow-2xl transition-transform duration-300 ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {loading && (
        <p className="p-6 text-sm text-topsoil/70">Loading field data…</p>
      )}

      {field && !loading && (
        <div className="space-y-4 p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-heading text-2xl text-soil-dark">
                {field.name}
              </h2>
              <p className="text-sm text-topsoil/70">{field.acres} acres · Story County, IA</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full px-2 py-1 text-topsoil/60 hover:bg-sand/60"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="rounded-xl border border-rust/40 bg-rust/10 p-4">
            <p className="font-heading text-base text-rust">What this means for you</p>
            <p className="mt-1 text-sm text-soil-dark/90">{field.aiExplanation}</p>
          </div>

          <ScoreCard score={field.score} />
          <RotationPlan plan={field.rotation} />
          <SeasonCalendar calendar={field.calendar} />

          <div className="rounded-xl border border-clay/40 bg-cream p-4">
            <p className="font-heading text-lg">Field profile</p>
            <dl className="mt-2 grid grid-cols-2 gap-y-1.5 text-sm">
              <dt className="text-topsoil/70">Organic matter</dt>
              <dd className="text-right font-medium">{field.soil.organicMatterPct}%</dd>
              <dt className="text-topsoil/70">Topsoil depth</dt>
              <dd className="text-right font-medium">{field.soil.topsoilDepthIn} in</dd>
              <dt className="text-topsoil/70">Slope</dt>
              <dd className="text-right font-medium">{field.soil.slopePct}%</dd>
              <dt className="text-topsoil/70">Erosion class</dt>
              <dd className="text-right font-medium">{field.soil.erosionClass}</dd>
              <dt className="text-topsoil/70">Drainage</dt>
              <dd className="text-right font-medium">{field.soil.drainageClass}</dd>
            </dl>
          </div>
        </div>
      )}
    </aside>
  );
}

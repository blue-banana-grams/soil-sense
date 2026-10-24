import { ClipboardList, FlaskConical, Leaf, Shovel, Tractor, type LucideIcon } from 'lucide-react';
import type { Recommendation, RecommendationId } from '../types';
import { ConfidenceBadge } from './ConfidenceBadge';

const ICON: Record<RecommendationId, LucideIcon> = {
  structure_organic_matter: Tractor,
  nitrogen_plan: Leaf,
  ph_direction: FlaskConical,
  compaction: Shovel,
  lime_rate: FlaskConical,
  phosphorus_potassium_rate: FlaskConical,
};

export function Recommendations({ items }: { items: Recommendation[] }) {
  const ready = items.filter((r) => r.status === 'ready');
  // Not ready, but nothing the farmer can add would unlock it (e.g. nitrogen, which needs a regional method).
  const guidance = items.filter((r) => r.status === 'needs_data' && r.missing.length === 0);
  const needsData = items.filter((r) => r.status === 'needs_data' && r.missing.length > 0);

  return (
    <div className="space-y-3">
      <p className="px-1 font-heading text-lg">What to do</p>

      {ready.map((rec) => {
        const Icon = ICON[rec.id];
        return (
          <div key={rec.id} className="rounded-2xl border border-clay/40 bg-sand/35 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-leaf/20 text-field-green">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                  <p className="text-base font-semibold">{rec.title}</p>
                  {rec.confidence && <ConfidenceBadge confidence={rec.confidence} />}
                </div>
                <p className="mt-1 text-base leading-relaxed text-soil-dark/90">{rec.advice}</p>
                {rec.improvesWith.length > 0 && (
                  <p className="mt-2 text-sm text-topsoil/70">
                    More accurate with: {rec.improvesWith.join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {guidance.map((rec) => {
        const Icon = ICON[rec.id];
        return (
          <div key={rec.id} className="rounded-2xl border border-clay/40 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sand text-topsoil">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                  <p className="text-base font-semibold">{rec.title}</p>
                  <span className="rounded-full bg-sand px-2.5 py-0.5 text-xs font-semibold text-topsoil">
                    General guidance
                  </span>
                </div>
                <p className="mt-1 text-base leading-relaxed text-soil-dark/90">{rec.advice}</p>
              </div>
            </div>
          </div>
        );
      })}

      {needsData.length > 0 && (
        <details className="group rounded-2xl border border-dashed border-clay/70 p-4">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-corn-yellow/25 text-topsoil">
              <ClipboardList className="h-5 w-5" aria-hidden />
            </span>
            <span className="flex-1">
              <span className="block text-base font-semibold">Get sharper advice</span>
              <span className="block text-sm text-topsoil/70">
                {needsData.length} more piece{needsData.length === 1 ? '' : 's'} of advice once you add a bit more info
              </span>
            </span>
            <span className="text-sm font-medium text-subsoil group-open:hidden">Show</span>
            <span className="hidden text-sm font-medium text-subsoil group-open:inline">Hide</span>
          </summary>
          <ul className="mt-3 space-y-3">
            {needsData.map((rec) => (
              <li key={rec.id} className="rounded-xl bg-cream p-3 ring-1 ring-clay/30">
                <p className="text-base font-semibold">{rec.title}</p>
                <p className="mt-0.5 text-base text-soil-dark/90">{rec.advice}</p>
                <p className="mt-1.5 text-sm font-medium text-rust">Add: {rec.missing.join(', ')}</p>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

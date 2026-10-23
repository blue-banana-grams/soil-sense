import type { Recommendation } from '../types';
import { ConfidenceBadge } from './ConfidenceBadge';

export function Recommendations({ items }: { items: Recommendation[] }) {
  return (
    <div className="rounded-xl border border-clay/40 bg-cream p-4">
      <p className="font-heading text-lg">Recommendations</p>
      <ul className="mt-3 space-y-2.5">
        {items.map((rec) => (
          <li
            key={rec.id}
            className={`rounded-lg p-3 ${rec.status === 'ready' ? 'bg-sand/40' : 'border border-dashed border-clay/60'}`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium">{rec.title}</p>
              {rec.confidence ? (
                <ConfidenceBadge confidence={rec.confidence} />
              ) : (
                <span className="shrink-0 text-[11px] font-semibold text-topsoil/60">
                  Needs data
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-soil-dark/90">{rec.advice}</p>
            {rec.missing.length > 0 && (
              <p className="mt-1.5 text-xs text-rust">Needs: {rec.missing.join(', ')}</p>
            )}
            {rec.improvesWith.length > 0 && (
              <p className="mt-1 text-xs text-topsoil/60">
                More confident with: {rec.improvesWith.join(', ')}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

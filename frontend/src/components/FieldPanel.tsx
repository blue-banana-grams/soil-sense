import { useState } from 'react';
import { CalendarDays, Layers, Sprout, Wheat, X, type LucideIcon } from 'lucide-react';
import type { FieldDetail } from '../types';
import { ScoreCard } from './ScoreCard';
import { RotationPlan } from './RotationPlan';
import { SeasonCalendar } from './SeasonCalendar';
import { Recommendations } from './Recommendations';
import { SoilProfile } from './SoilProfile';
import { CountyComparison } from './CountyComparison';

type TabId = 'overview' | 'plan' | 'season' | 'soil';

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Overview', icon: Sprout },
  { id: 'plan', label: 'Plan', icon: Wheat },
  { id: 'season', label: 'Season', icon: CalendarDays },
  { id: 'soil', label: 'Soil', icon: Layers },
];

interface FieldPanelProps {
  field: FieldDetail | null;
  loading: boolean;
  onClose: () => void;
}

export function FieldPanel({ field, loading, onClose }: FieldPanelProps) {
  const open = loading || field !== null;

  return (
    <aside
      className={`fixed inset-y-0 right-0 z-[1100] flex w-full max-w-md flex-col bg-cream shadow-2xl transition-transform duration-300 ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
      aria-hidden={!open}
    >
      {loading && <p className="p-6 text-base text-topsoil/70">Loading field…</p>}
      {field && !loading && <FieldDetailView key={field.id} field={field} onClose={onClose} />}
    </aside>
  );
}

function FieldDetailView({ field, onClose }: { field: FieldDetail; onClose: () => void }) {
  const [tab, setTab] = useState<TabId>('overview');

  return (
    <>
      <div className="field-rows bg-topsoil px-5 pb-0 pt-4 text-cream">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-heading text-2xl leading-tight">{field.name}</h2>
            <p className="mt-0.5 text-sm text-sand/90">
              {field.acres} acres · {field.soil.mapUnitComponent}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cream/10 hover:bg-cream/20"
            aria-label="Close field"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-4 grid grid-cols-4 gap-1" role="tablist">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(id)}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-t-xl text-sm font-medium transition-colors ${
                  active ? 'bg-cream text-soil-dark' : 'text-sand/90 hover:bg-cream/10'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden />
                {label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-5" role="tabpanel">
        {tab === 'overview' && (
          <>
            <div className="rounded-2xl bg-field-green p-4 text-cream">
              <p className="font-heading text-lg">What this means for you</p>
              <p className="mt-1 text-base leading-relaxed text-cream/95">{field.aiExplanation}</p>
            </div>
            <ScoreCard score={field.score} />
            <Recommendations items={field.recommendations} />
          </>
        )}
        {tab === 'plan' && (
          <>
            <RotationPlan plan={field.rotation} />
            {field.countyBenchmark && <CountyComparison benchmark={field.countyBenchmark} />}
          </>
        )}
        {tab === 'season' && <SeasonCalendar calendar={field.calendar} />}
        {tab === 'soil' && <SoilProfile field={field} />}
      </div>
    </>
  );
}

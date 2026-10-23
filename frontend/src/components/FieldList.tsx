import { ChevronRight } from 'lucide-react';
import type { FieldSummary } from '../types';
import { LEGEND_COLORS, scoreColor } from '../lib/score';

interface FieldListProps {
  fields: FieldSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function FieldList({ fields, selectedId, onSelect }: FieldListProps) {
  return (
    <div className="pointer-events-auto rounded-2xl bg-cream/95 p-3 shadow-xl ring-1 ring-clay/40 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-1">
        <p className="font-heading text-base text-soil-dark">Your fields</p>
        <Legend />
      </div>
      <ul className="mt-2 flex gap-2 overflow-x-auto pb-1 sm:flex-col sm:overflow-visible sm:pb-0">
        {fields.map((field) => {
          const selected = field.id === selectedId;
          return (
            <li key={field.id} className="shrink-0">
              <button
                onClick={() => onSelect(field.id)}
                className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
                  selected ? 'bg-corn-yellow/30 ring-2 ring-corn-yellow' : 'bg-sand/40 hover:bg-sand/70'
                }`}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-1 ring-soil-dark/30"
                  style={{
                    backgroundColor: scoreColor(field.scoreValue),
                    color: field.scoreValue < 35 ? '#2A1B12' : '#F6EFE1',
                  }}
                >
                  {field.scoreValue}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{field.name}</span>
                  <span className="block text-xs text-topsoil/70">{field.acres} acres</span>
                </span>
                <ChevronRight className="ml-auto hidden h-4 w-4 text-topsoil/50 sm:block" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-1.5 text-xs text-topsoil/70" aria-label="Map color key">
      <span>Healthy</span>
      <span className="flex overflow-hidden rounded-full ring-1 ring-soil-dark/20">
        {LEGEND_COLORS.map((color) => (
          <span key={color} className="h-2.5 w-3" style={{ backgroundColor: color }} />
        ))}
      </span>
      <span>Worn</span>
    </div>
  );
}

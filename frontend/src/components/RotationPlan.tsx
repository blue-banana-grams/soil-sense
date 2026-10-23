import type { RotationPlan as RotationPlanType } from '../types';

const CROP_COLOR: Record<string, string> = {
  Corn: '#E9B730',
  Soybeans: '#6E9A3E',
  'Cover crop': '#8A5A3B',
  Wheat: '#C49A6C',
};

export function RotationPlan({ plan }: { plan: RotationPlanType }) {
  return (
    <div className="rounded-xl border border-clay/40 bg-cream p-4">
      <p className="font-heading text-lg">Rotation plan</p>
      <p className="mt-1 text-sm text-topsoil/80">{plan.summary}</p>
      <ol className="mt-3 space-y-2">
        {plan.years.map((y) => (
          <li
            key={`${y.year}-${y.crop}`}
            className="flex items-start gap-3 rounded-lg bg-sand/40 p-2.5"
          >
            <span
              className="mt-0.5 flex h-8 w-14 shrink-0 items-center justify-center rounded-md text-xs font-semibold text-soil-dark"
              style={{ backgroundColor: CROP_COLOR[y.crop] ?? '#C49A6C' }}
            >
              {Number.isInteger(y.year) ? y.year : `Fall ${Math.floor(y.year)}`}
            </span>
            <div>
              <p className="text-sm font-medium">{y.crop}</p>
              <p className="text-xs text-topsoil/70">{y.why}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

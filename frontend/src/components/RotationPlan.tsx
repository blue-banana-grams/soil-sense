import { Leaf, Sprout, Wheat, type LucideIcon } from 'lucide-react';
import type { RotationPlan as RotationPlanType } from '../types';

const CROP_STYLE: Record<string, { color: string; icon: LucideIcon }> = {
  Corn: { color: '#E9B730', icon: Wheat },
  Soybeans: { color: '#6E9A3E', icon: Sprout },
  'Cover crop': { color: '#8A5A3B', icon: Leaf },
  Wheat: { color: '#C49A6C', icon: Wheat },
};

export function RotationPlan({ plan }: { plan: RotationPlanType }) {
  return (
    <div className="rounded-2xl border border-clay/40 bg-cream p-4">
      <p className="font-heading text-lg">Your rotation plan</p>
      <p className="mt-1 text-base text-topsoil/85">{plan.summary}</p>

      <ol className="relative mt-4 space-y-3 before:absolute before:bottom-6 before:left-[1.4rem] before:top-6 before:w-0.5 before:bg-clay/40">
        {plan.years.map((y) => {
          const style = CROP_STYLE[y.crop] ?? CROP_STYLE.Wheat;
          const Icon = style.icon;
          const isFall = !Number.isInteger(y.year);
          return (
            <li key={`${y.year}-${y.crop}`} className="relative flex items-start gap-3">
              <span
                className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-4 ring-cream"
                style={{ backgroundColor: style.color }}
              >
                <Icon className="h-5 w-5 text-soil-dark" aria-hidden />
              </span>
              <div className="flex-1 rounded-xl bg-sand/35 px-3 py-2.5">
                <p className="text-sm font-semibold text-topsoil/70">
                  {isFall ? `Fall ${Math.floor(y.year)}` : y.year}
                </p>
                <p className="text-base font-semibold">{y.crop}</p>
                <p className="mt-0.5 text-sm text-topsoil/80">{y.why}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

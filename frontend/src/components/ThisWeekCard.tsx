import type { ReactNode } from 'react';
import { CloudRain, Thermometer, Sun } from 'lucide-react';
import type { ThisWeek } from '../types';

export function ThisWeekCard({ week }: { week: ThisWeek }) {
  const { soilTempF, next7 } = week.conditions;

  return (
    <section className="rounded-2xl bg-field-green p-4 text-cream sm:p-5">
      <p className="text-sm font-medium uppercase tracking-wide text-cream/70">This week on your field</p>
      <p className="mt-0.5 font-heading text-2xl">{week.headline}</p>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Stat icon={<Thermometer className="h-4 w-4" aria-hidden />} label="Soil now" value={soilTempF === null ? '—' : `${soilTempF}°F`} />
        <Stat icon={<CloudRain className="h-4 w-4" aria-hidden />} label="Rain, 7 days" value={`${next7.rainIn} in`} />
        <Stat icon={<Sun className="h-4 w-4" aria-hidden />} label="Low / high" value={`${next7.lowF}° / ${next7.highF}°`} />
      </div>

      <ul className="mt-4 space-y-2">
        {week.items.map((item) => (
          <li key={item} className="flex gap-2.5 text-base leading-relaxed">
            <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-corn-yellow" aria-hidden />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-cream/10 px-2 py-2">
      <p className="flex items-center justify-center gap-1 text-xs text-cream/75">
        {icon}
        {label}
      </p>
      <p className="mt-0.5 text-base font-semibold">{value}</p>
    </div>
  );
}

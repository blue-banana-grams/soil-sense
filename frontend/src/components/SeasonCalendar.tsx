import type { ReactNode } from 'react';
import { Leaf, Scissors, Sprout, Sun, type LucideIcon } from 'lucide-react';
import type { SeasonCalendar as SeasonCalendarType } from '../types';
import { dateRange, dayOfYear, shortDate } from '../lib/format';

const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];

interface Band {
  label: string;
  icon: LucideIcon;
  color: string;
  start: string;
  end: string;
}

export function SeasonCalendar({ calendar }: { calendar: SeasonCalendarType }) {
  const year = calendar.plantingWindow.start.slice(0, 4);
  const axisStart = dayOfYear(`${year}-04-01`);
  const axisEnd = dayOfYear(`${year}-11-30`);
  const span = axisEnd - axisStart;
  const pct = (iso: string) => ((dayOfYear(iso) - axisStart) / span) * 100;

  const maturity = calendar.growthStages.at(-1)?.estDate ?? calendar.harvestWindow.start;
  const bands: Band[] = [
    { label: 'Plant', icon: Sprout, color: '#6E9A3E', ...calendar.plantingWindow },
    { label: 'Grow', icon: Sun, color: '#E9B730', start: calendar.plantingWindow.end, end: maturity },
    { label: 'Harvest', icon: Scissors, color: '#8A5A3B', ...calendar.harvestWindow },
    { label: 'Cover crop', icon: Leaf, color: '#33502A', ...calendar.coverCropWindow },
  ];

  return (
    <>
      <div className="rounded-2xl border border-clay/40 bg-cream p-4">
        <p className="font-heading text-lg">Your {year} season</p>
        <p className="mt-0.5 text-sm text-topsoil/70">Typical dates for Story County. Live weather coming soon.</p>

        <div className="mt-4">
          <div className="ml-24 grid grid-cols-8 text-center text-xs font-medium text-topsoil/60">
            {MONTHS.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
          <div className="mt-1 space-y-2">
            {bands.map((band) => {
              const Icon = band.icon;
              const left = pct(band.start);
              const width = Math.max(2, pct(band.end) - left);
              return (
                <div key={band.label} className="flex items-center gap-2">
                  <span className="flex w-22 shrink-0 items-center gap-1.5 text-sm font-medium">
                    <Icon className="h-4 w-4" style={{ color: band.color }} aria-hidden />
                    {band.label}
                  </span>
                  <div className="relative h-7 flex-1 rounded-md bg-sand/40">
                    <div
                      className="absolute inset-y-0 rounded-md"
                      style={{ left: `${left}%`, width: `${width}%`, backgroundColor: band.color }}
                      title={`${band.label}: ${shortDate(band.start)} – ${shortDate(band.end)}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <dl className="mt-4 divide-y divide-clay/25">
          <Row label="Plant corn">{dateRange(calendar.plantingWindow)}</Row>
          <Row label="Harvest">{dateRange(calendar.harvestWindow)}</Row>
          <Row label="Seed cover crop">{dateRange(calendar.coverCropWindow)}</Row>
          <Row label="Nitrogen">{calendar.fertilizerTiming}</Row>
        </dl>
      </div>

      <div className="rounded-2xl border border-clay/40 bg-cream p-4">
        <p className="font-heading text-lg">Crop stages to watch</p>
        <p className="mt-0.5 text-sm text-topsoil/70">
          Based on heat units (growing degree days) your corn needs to reach each stage.
        </p>
        <ul className="mt-3 divide-y divide-clay/25">
          {calendar.growthStages.map((stage) => (
            <li key={stage.stage} className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-base">{stage.stage}</span>
              <span className="text-right">
                <span className="block text-base font-semibold">~{shortDate(stage.estDate)}</span>
                <span className="block text-xs text-topsoil/60">{stage.gddThreshold} GDD</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-base text-topsoil/80">{label}</dt>
      <dd className="text-right text-base font-semibold">{children}</dd>
    </div>
  );
}

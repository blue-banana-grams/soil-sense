import type { ReactNode } from 'react';
import { Leaf, Scissors, Sprout, Sun, type LucideIcon } from 'lucide-react';
import type { SeasonCalendar as SeasonCalendarType } from '../types';
import { dateRange, dayOfYear, shortDate } from '../lib/format';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface Band {
  label: string;
  icon: LucideIcon;
  color: string;
  start: string;
  end: string;
}

const monthIndex = (iso: string) => Number(iso.slice(5, 7)) - 1;

export function SeasonCalendar({ calendar }: { calendar: SeasonCalendarType }) {
  const { year } = calendar;
  const maturity = calendar.growthStages.at(-1)?.estDate ?? calendar.harvestWindow.start;
  const bands: Band[] = [
    { label: 'Plant', icon: Sprout, color: '#6E9A3E', ...calendar.plantingWindow },
    { label: 'Grow', icon: Sun, color: '#E9B730', start: calendar.plantingWindow.end, end: maturity },
    { label: 'Harvest', icon: Scissors, color: '#8A5A3B', ...calendar.harvestWindow },
    { label: 'Cover crop', icon: Leaf, color: '#33502A', ...calendar.coverCropWindow },
  ];

  // Show April to November at least, widened for early-planting or late-harvest areas.
  const firstMonth = Math.min(3, monthIndex(calendar.plantingWindow.start));
  const coverEnd = calendar.coverCropWindow.end;
  const lastMonth = coverEnd.startsWith(String(year)) ? Math.max(10, monthIndex(coverEnd)) : 11;
  const months = MONTH_NAMES.slice(firstMonth, lastMonth + 1);
  const axisStart = dayOfYear(`${year}-${String(firstMonth + 1).padStart(2, '0')}-01`);
  const axisEnd = dayOfYear(new Date(Date.UTC(year, lastMonth + 1, 0)).toISOString().slice(0, 10));
  const pct = (iso: string) => {
    const doy = iso.startsWith(String(year)) ? dayOfYear(iso) : axisEnd;
    return Math.min(100, Math.max(0, ((doy - axisStart) / (axisEnd - axisStart)) * 100));
  };

  return (
    <>
      <div className="rounded-2xl border border-clay/40 bg-cream p-4">
        <p className="font-heading text-lg">Your {year} season</p>
        <p className="mt-0.5 text-sm text-topsoil/70">Typical dates for this spot, from 30 years of local weather.</p>

        <div className="@container mt-4">
          <div
            className="ml-24 grid text-center text-xs font-medium text-topsoil/60"
            style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))` }}
          >
            {months.map((m) => (
              // Initials on narrow cards (phones), full names when there's room.
              <span key={m}>
                <span aria-hidden className="@min-[30rem]:hidden">
                  {m[0]}
                </span>
                <span className="sr-only @min-[30rem]:not-sr-only">{m}</span>
              </span>
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

        {calendar.notes.length > 0 && (
          <ul className="mt-3 space-y-1.5 rounded-xl bg-sand/35 p-3 text-sm text-topsoil/90">
            {calendar.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-clay/40 bg-cream p-4">
        <p className="font-heading text-lg">Crop stages to watch</p>
        <p className="mt-0.5 text-sm text-topsoil/70">
          When corn planted at the start of the window usually reaches each stage, from local heat units (GDD).
        </p>
        <ul className="mt-3 divide-y divide-clay/25">
          {calendar.growthStages.map((stage) => (
            <li key={stage.stage} className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-base">{stage.stage}</span>
              <span className="text-right">
                <span className="block text-base font-semibold">
                  {stage.estDate ? `~${shortDate(stage.estDate)}` : 'Not before frost'}
                </span>
                <span className="block text-xs text-topsoil/60">{stage.gddThreshold.toLocaleString()} GDD</span>
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

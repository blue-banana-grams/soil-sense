import type { ReactNode } from 'react';
import type { SeasonCalendar as SeasonCalendarType } from '../types';

export function SeasonCalendar({ calendar }: { calendar: SeasonCalendarType }) {
  return (
    <div className="rounded-xl border border-clay/40 bg-cream p-4">
      <p className="font-heading text-lg">Season calendar</p>
      <dl className="mt-3 space-y-2.5 text-sm">
        <Row label="Planting window">
          {calendar.plantingWindow.start} – {calendar.plantingWindow.end}
        </Row>
        <Row label="Fertilizer timing">{calendar.fertilizerTiming}</Row>
        <Row label="Harvest window">
          {calendar.harvestWindow.start} – {calendar.harvestWindow.end}
        </Row>
        <Row label="Cover crop window">
          {calendar.coverCropWindow.start} – {calendar.coverCropWindow.end}
        </Row>
      </dl>
      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-topsoil/60">
        Growth stages (GDD)
      </p>
      <ul className="mt-2 space-y-1.5">
        {calendar.growthStages.map((stage) => (
          <li
            key={stage.stage}
            className="flex items-center justify-between text-sm"
          >
            <span>{stage.stage}</span>
            <span className="text-topsoil/70">
              {stage.gddThreshold} GDD · {stage.estDate}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-topsoil/70">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}

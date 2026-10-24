import type { ReactNode } from 'react';
import type { Measured, Report, Tier } from '../types';
import { RUNOFF_RISK } from '../lib/format';

const TIER_LABEL: Record<Tier, string> = {
  lab: 'Your lab test',
  field_test: 'Field test',
  auto: 'USDA soil survey',
  field_kit: 'Field kit',
  observation: 'Your observation',
  farmer_entry: 'You told us',
};

const TILLAGE_LABEL = { none: 'No-till', reduced: 'Reduced tillage', conventional: 'Conventional tillage' };

export function SoilProfile({ report }: { report: Report }) {
  const { soil, management, cropHistory } = report;
  const tillage = management.tillage;
  const amendments = management.amendments;
  const group = soil.hydrologicGroup.value;
  const runoff = RUNOFF_RISK[group.charAt(0)];

  return (
    <>
      <Section title="Your soil" subtitle={soil.mapUnitComponent}>
        <Row label="Organic matter" input={soil.organicMatterPct} />
        <Row label="Topsoil depth" input={soil.topsoilDepthIn} />
        <Row label="Slope" input={soil.slopePct} />
        <Row label="Erosion" input={soil.erosionClass} />
        <Row label="Drainage" input={soil.drainageClass} />
        <Row label="Soil texture" input={soil.texture} display={capitalize(soil.texture.value)} />
        <Row label="pH" input={soil.ph} />
        <Row label="Nutrient holding (CEC)" input={soil.cecMeq100g} />
        <Row
          label="Runoff risk"
          input={soil.hydrologicGroup}
          display={runoff ? `${runoff} (group ${group})` : group}
        />
        {soil.bufferPh && <Row label="Buffer pH" input={soil.bufferPh} />}
        {soil.phosphorusPpm && <Row label={`Phosphorus (${soil.phosphorusPpm.method})`} input={soil.phosphorusPpm} />}
        {soil.potassiumPpm && <Row label="Potassium" input={soil.potassiumPpm} />}
        {soil.nitrateNPpm && <Row label="Nitrate-N" input={soil.nitrateNPpm} />}
      </Section>

      <Section title="What's grown here" subtitle="From USDA CropScape satellite records">
        {cropHistory.value.length === 0 ? (
          <p className="py-2.5 text-base text-topsoil/80">Satellite crop records weren't available for this spot.</p>
        ) : (
          cropHistory.value.map((c) => (
            <div key={c.year} className="flex justify-between py-2.5 text-base">
              <dt className="text-topsoil/80">{c.year}</dt>
              <dd className="font-semibold">{c.crop}</dd>
            </div>
          ))
        )}
      </Section>

      <Section title="How you farm it">
        <Row
          label="Tillage"
          input={tillage}
          display={
            tillage &&
            `${TILLAGE_LABEL[tillage.value.type]}${tillage.value.depthIn ? `, ${tillage.value.depthIn} in deep` : ''}`
          }
        />
        <Row
          label="Ponding / slow drying"
          input={management.pondingOrSlowDrying}
          display={management.pondingOrSlowDrying && capitalize(management.pondingOrSlowDrying.value)}
        />
        <Row
          label="Fertilizer & manure"
          input={amendments}
          display={
            amendments &&
            (amendments.value.length === 0
              ? 'None this season'
              : amendments.value
                  .map((a) => (a.rate === null ? a.product : `${a.product}, ${a.rate} ${a.unit}`.trim()))
                  .join('; '))
          }
        />
      </Section>

      <p className="px-1 text-sm text-topsoil/70">
        USDA soil survey values describe the typical soil mapped at this spot, not a test of your field. A lab soil test
        makes every recommendation more accurate.
      </p>
    </>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-clay/40 bg-cream p-4">
      <p className="font-heading text-lg">{title}</p>
      {subtitle && <p className="text-sm text-topsoil/70">{subtitle}</p>}
      <dl className="mt-2 divide-y divide-clay/25">{children}</dl>
    </div>
  );
}

function Row({
  label,
  input,
  display,
}: {
  label: string;
  input: Measured<unknown> | undefined;
  display?: string;
}) {
  const rawUnit = input?.unit;
  const unit = !rawUnit || rawUnit === 'pH' ? '' : rawUnit === '%' ? '%' : ` ${rawUnit}`;

  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-base text-topsoil/80">{label}</dt>
      <dd className="text-right">
        {input ? (
          <>
            <span className="text-base font-semibold">{display ?? `${String(input.value)}${unit}`}</span>
            <span className="block text-xs text-topsoil/60">
              {TIER_LABEL[input.tier]}
              {input.sampleDate ? ` · ${input.sampleDate}` : ''}
            </span>
          </>
        ) : (
          <span className="text-base font-medium text-topsoil/60">Not entered yet</span>
        )}
      </dd>
    </div>
  );
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

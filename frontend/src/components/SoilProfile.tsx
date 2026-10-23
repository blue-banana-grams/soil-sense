import type { ReactNode } from 'react';
import type { FieldDetail, Measured, Tier } from '../types';
import { RUNOFF_RISK } from '../lib/format';

const TIER_LABEL: Record<Tier, string> = {
  lab: 'Lab test',
  field_test: 'Field test',
  auto: 'USDA soil map',
  field_kit: 'Field kit',
  observation: 'Your observation',
  farmer_entry: 'You told us',
};

const TILLAGE_LABEL = { none: 'No-till', reduced: 'Reduced tillage', conventional: 'Conventional tillage' };

export function SoilProfile({ field }: { field: FieldDetail }) {
  const { soil, management } = field;
  const tillage = management.tillage;
  const amendments = management.amendments;

  return (
    <>
      <Section title="Your soil">
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
          display={`${RUNOFF_RISK[soil.hydrologicGroup.value]} (group ${soil.hydrologicGroup.value})`}
        />
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
        <Row label="Yield goal" input={management.yieldGoalBuAc} />
        <Row
          label="Fertilizer & manure"
          input={amendments}
          display={
            amendments &&
            (amendments.value.length === 0
              ? 'None this season'
              : amendments.value.map((a) => `${a.product}, ${a.rate} ${a.unit}`).join('; '))
          }
        />
      </Section>

      <p className="px-1 text-sm text-topsoil/70">
        Values from USDA soil maps are averages for the area, not your exact field. A lab soil test
        makes every recommendation more accurate.
      </p>
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-clay/40 bg-cream p-4">
      <p className="font-heading text-lg">{title}</p>
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
          <span className="text-base font-medium text-rust">Not entered yet</span>
        )}
      </dd>
    </div>
  );
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

import type { FieldDetail, Measured, Tier } from '../types';
import { ScoreCard } from './ScoreCard';
import { RotationPlan } from './RotationPlan';
import { SeasonCalendar } from './SeasonCalendar';
import { Recommendations } from './Recommendations';

const TIER_LABEL: Record<Tier, string> = {
  lab: 'Lab test',
  field_test: 'Field test',
  auto: 'USDA map data',
  field_kit: 'Field kit',
  observation: 'Observation',
  farmer_entry: 'Farmer entry',
};

const TILLAGE_LABEL = { none: 'No-till', reduced: 'Reduced', conventional: 'Conventional' };

interface FieldPanelProps {
  field: FieldDetail | null;
  loading: boolean;
  onClose: () => void;
}

export function FieldPanel({ field, loading, onClose }: FieldPanelProps) {
  const open = loading || field !== null;

  return (
    <aside
      className={`fixed inset-y-0 right-0 z-[1100] w-full max-w-md overflow-y-auto bg-cream shadow-2xl transition-transform duration-300 ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {loading && (
        <p className="p-6 text-sm text-topsoil/70">Loading field data…</p>
      )}

      {field && !loading && (
        <div className="space-y-4 p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-heading text-2xl text-soil-dark">
                {field.name}
              </h2>
              <p className="text-sm text-topsoil/70">
                {field.acres} acres · {field.soil.mapUnitComponent} · Story County, IA
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full px-2 py-1 text-topsoil/60 hover:bg-sand/60"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="rounded-xl border border-rust/40 bg-rust/10 p-4">
            <p className="font-heading text-base text-rust">What this means for you</p>
            <p className="mt-1 text-sm text-soil-dark/90">{field.aiExplanation}</p>
          </div>

          <ScoreCard score={field.score} />
          <Recommendations items={field.recommendations} />
          <RotationPlan plan={field.rotation} />
          <SeasonCalendar calendar={field.calendar} />
          <FieldProfile field={field} />
        </div>
      )}
    </aside>
  );
}

function FieldProfile({ field }: { field: FieldDetail }) {
  const { soil, management } = field;
  const tillage = management.tillage;

  return (
    <div className="rounded-xl border border-clay/40 bg-cream p-4">
      <p className="font-heading text-lg">Field profile</p>
      <dl className="mt-2 space-y-1.5 text-sm">
        <ProfileRow label="Organic matter" input={soil.organicMatterPct} />
        <ProfileRow label="Topsoil depth" input={soil.topsoilDepthIn} />
        <ProfileRow label="Slope" input={soil.slopePct} />
        <ProfileRow label="Erosion class" input={soil.erosionClass} />
        <ProfileRow label="Drainage" input={soil.drainageClass} />
        <ProfileRow label="Texture" input={soil.texture} />
        <ProfileRow label="pH" input={soil.ph} />
        <ProfileRow label="CEC" input={soil.cecMeq100g} />
        <ProfileRow label="Hydrologic group" input={soil.hydrologicGroup} />
        <ProfileRow
          label="Tillage"
          input={tillage}
          display={
            tillage &&
            `${TILLAGE_LABEL[tillage.value.type]}${tillage.value.depthIn ? `, ${tillage.value.depthIn} in` : ''}`
          }
        />
        <ProfileRow label="Yield goal" input={management.yieldGoalBuAc} />
        <ProfileRow
          label="Amendments"
          input={management.amendments}
          display={
            management.amendments &&
            (management.amendments.value.length === 0
              ? 'None'
              : management.amendments.value
                  .map((a) => `${a.product} ${a.rate} ${a.unit}`)
                  .join('; '))
          }
        />
      </dl>
    </div>
  );
}

function ProfileRow({
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
    <div className="flex items-start justify-between gap-3">
      <dt className="text-topsoil/70">{label}</dt>
      <dd className="text-right">
        {input ? (
          <>
            <span className="font-medium">{display ?? `${String(input.value)}${unit}`}</span>
            <span className="block text-[11px] text-topsoil/55">
              {TIER_LABEL[input.tier]}
              {input.sampleDate ? ` · ${input.sampleDate}` : ''}
            </span>
          </>
        ) : (
          <span className="text-rust">Not entered</span>
        )}
      </dd>
    </div>
  );
}

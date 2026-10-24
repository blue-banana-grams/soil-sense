import { useEffect, useState, type ReactNode } from 'react';
import { Check, Plus, Trash2, X } from 'lucide-react';
import type { Amendment, FarmerDetails, LabTest, PondingFrequency, PTestMethod, TillageType } from '../types';

const TILLAGE_OPTIONS: { value: TillageType; label: string; hint: string }[] = [
  { value: 'none', label: 'No-till', hint: 'I plant straight into last year’s residue' },
  { value: 'reduced', label: 'Reduced tillage', hint: 'One light pass, most residue stays on top' },
  { value: 'conventional', label: 'Conventional tillage', hint: 'Chisel, disk or plow, little residue left' },
];
const PONDING_OPTIONS: { value: PondingFrequency; label: string }[] = [
  { value: 'never', label: 'Never' },
  { value: 'sometimes', label: 'Sometimes' },
  { value: 'often', label: 'Often' },
];
const UNITS = ['lb N/ac', 'gal/ac', 'ton/ac', 'lb/ac'];
const P_METHODS: PTestMethod[] = ['Bray-P1', 'Mehlich-3', 'Olsen'];

// Same ranges the server enforces, so typos are caught on the field instead of after sending.
const RANGES = {
  tillageDepth: [0, 24],
  lastYield: [0, 400],
  rate: [0, 100000],
  ph: [3.5, 9.5],
  bufferPh: [4, 8],
  om: [0, 20],
  p: [0, 500],
  k: [0, 1500],
  nitrate: [0, 200],
} as const;

export type DetailsStep = 'tillage' | 'drainage' | 'yields' | 'fertilizer' | 'lab';
const STEP_LABEL: Record<DetailsStep, string> = {
  tillage: 'Tillage',
  drainage: 'Drainage',
  yields: 'Last season',
  fertilizer: 'Fertilizer',
  lab: 'Soil test',
};

interface AmendmentDraft {
  product: string;
  rate: string;
  unit: string;
  date: string;
}

type LabKey = 'ph' | 'bufferPh' | 'om' | 'p' | 'k' | 'nitrate';

interface Draft {
  tillage: TillageType | '';
  tillageDepth: string;
  ponding: PondingFrequency | '';
  lastYield: string;
  noneApplied: boolean;
  amendments: AmendmentDraft[];
  lab: Record<LabKey | 'sampleDate', string> & { pMethod: PTestMethod | '' };
}

const str = (n: number | undefined | null) => (n === undefined || n === null ? '' : String(n));
const num = (s: string) => (s.trim() === '' ? undefined : Number(s));

function rangeError(value: string, [min, max]: readonly [number, number]): string | undefined {
  if (value.trim() === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? undefined : `Enter a number from ${min} to ${max}.`;
}

function toDraft(d: FarmerDetails, lastYear: number | null): Draft {
  const lab = d.labTest;
  return {
    tillage: d.tillage?.type ?? '',
    tillageDepth: str(d.tillage?.depthIn),
    ponding: d.pondingOrSlowDrying ?? '',
    lastYield: str(d.yieldHistory?.find((y) => y.year === lastYear)?.bushelsPerAcre),
    noneApplied: d.amendments !== undefined && d.amendments.length === 0,
    amendments: (d.amendments ?? []).map((a) => ({
      product: a.product,
      rate: str(a.rate),
      unit: a.unit || 'lb N/ac',
      date: a.date ?? '',
    })),
    lab: {
      sampleDate: lab?.sampleDate ?? '',
      ph: str(lab?.ph),
      bufferPh: str(lab?.bufferPh),
      om: str(lab?.organicMatterPct),
      p: str(lab?.phosphorusPpm),
      pMethod: lab?.pTestMethod ?? '',
      k: str(lab?.potassiumPpm),
      nitrate: str(lab?.nitrateNPpm),
    },
  };
}

const filledRows = (draft: Draft) => draft.amendments.filter((a) => a.product || a.rate || a.date);

// Field-level problems, keyed by field. Only impossible values count; blanks never do.
function findErrors(draft: Draft): Record<string, string> {
  const errors: Record<string, string> = {};
  const check = (key: string, value: string, range: readonly [number, number]) => {
    const message = rangeError(value, range);
    if (message) errors[key] = message;
  };
  check('tillageDepth', draft.tillageDepth, RANGES.tillageDepth);
  check('lastYield', draft.lastYield, RANGES.lastYield);
  if (!draft.noneApplied) {
    draft.amendments.forEach((a, i) => {
      check(`rate.${i}`, a.rate, RANGES.rate);
      if ((a.rate || a.date) && !a.product.trim()) errors[`product.${i}`] = 'Add the product name, or remove this row.';
    });
  }
  (['ph', 'bufferPh', 'om', 'p', 'k', 'nitrate'] as LabKey[]).forEach((k) => check(`lab.${k}`, draft.lab[k], RANGES[k]));
  return errors;
}

function stepOfError(key: string): DetailsStep {
  if (key === 'tillageDepth') return 'tillage';
  if (key === 'lastYield') return 'yields';
  if (key.startsWith('lab.')) return 'lab';
  return 'fertilizer';
}

function fromDraft(draft: Draft, lastYear: number | null): FarmerDetails {
  const details: FarmerDetails = {};
  if (draft.tillage) details.tillage = { type: draft.tillage, depthIn: num(draft.tillageDepth) ?? null };
  if (draft.ponding) details.pondingOrSlowDrying = draft.ponding;

  const lastYield = num(draft.lastYield);
  if (lastYield !== undefined && lastYear !== null) details.yieldHistory = [{ year: lastYear, bushelsPerAcre: lastYield }];

  if (draft.noneApplied) {
    details.amendments = [];
  } else {
    const rows = filledRows(draft);
    if (rows.length > 0) {
      details.amendments = rows.map<Amendment>((a) => ({
        product: a.product.trim(),
        rate: num(a.rate) ?? null,
        unit: a.rate.trim() ? a.unit : '',
        date: a.date || null,
        method: '',
      }));
    }
  }

  const { lab } = draft;
  const labTest: LabTest = {
    sampleDate: lab.sampleDate || undefined,
    ph: num(lab.ph),
    bufferPh: num(lab.bufferPh),
    organicMatterPct: num(lab.om),
    phosphorusPpm: num(lab.p),
    pTestMethod: lab.pMethod || undefined,
    potassiumPpm: num(lab.k),
    nitrateNPpm: num(lab.nitrate),
  };
  const hasLabValue = (['ph', 'bufferPh', 'om', 'p', 'k', 'nitrate'] as LabKey[]).some((k) => lab[k].trim() !== '');
  if (hasLabValue) details.labTest = labTest;
  return details;
}

function stepHasInput(step: DetailsStep, draft: Draft): boolean {
  switch (step) {
    case 'tillage':
      return draft.tillage !== '';
    case 'drainage':
      return draft.ponding !== '';
    case 'yields':
      return draft.lastYield.trim() !== '';
    case 'fertilizer':
      return draft.noneApplied || filledRows(draft).length > 0;
    case 'lab':
      return Object.values(draft.lab).some((v) => v !== '');
  }
}

interface DetailsFormProps {
  initial: FarmerDetails;
  initialStep?: DetailsStep;
  lastCrop: { year: number; crop: string } | null;
  countyCornAvg: number | null;
  countyName: string;
  onCancel: () => void;
  onSubmit: (details: FarmerDetails) => void;
}

export function DetailsForm({ initial, initialStep, lastCrop, countyCornAvg, countyName, onCancel, onSubmit }: DetailsFormProps) {
  const lastYear = lastCrop?.year ?? null;
  const askYield = lastCrop !== null && (lastCrop.crop === 'Corn' || lastCrop.crop === 'Soybeans');
  const steps: DetailsStep[] = ['tillage', 'drainage', ...(askYield ? (['yields'] as const) : []), 'fertilizer', 'lab'];

  const [draft, setDraft] = useState<Draft>(() => toDraft(initial, lastYear));
  const [index, setIndex] = useState(() => Math.max(0, initialStep ? steps.indexOf(initialStep) : 0));
  const [showErrorSummary, setShowErrorSummary] = useState(false);
  const step = steps[index];
  const isLast = index === steps.length - 1;
  const errors = findErrors(draft);
  const errorKeys = Object.keys(errors);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const update = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const updateLab = (patch: Partial<Draft['lab']>) => setDraft((d) => ({ ...d, lab: { ...d.lab, ...patch } }));

  const save = () => {
    if (errorKeys.length > 0) {
      setIndex(Math.max(0, steps.indexOf(stepOfError(errorKeys[0]))));
      setShowErrorSummary(true);
      return;
    }
    onSubmit(fromDraft(draft, lastYear));
  };

  const next = () => (isLast ? save() : setIndex(index + 1));

  return (
    <div className="fixed inset-0 z-[1200] flex items-end justify-center bg-soil-dark/50 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="details-title"
        className="flex max-h-[92svh] w-full max-w-lg flex-col rounded-t-3xl bg-cream shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-clay/30 px-5 py-4">
          <div>
            <p className="text-sm font-medium text-topsoil/70">
              Step {index + 1} of {steps.length} · {STEP_LABEL[step]}
            </p>
            <div className="mt-1.5 flex gap-1.5">
              {steps.map((s, i) => (
                <button
                  key={s}
                  onClick={() => setIndex(i)}
                  aria-label={`Go to ${STEP_LABEL[s]}`}
                  className={`h-2 w-9 rounded-full ${i === index ? 'bg-field-green' : stepHasInput(s, draft) ? 'bg-leaf' : 'bg-sand'}`}
                />
              ))}
            </div>
          </div>
          <button
            onClick={onCancel}
            className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-sand/60"
            aria-label="Close without saving"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {step === 'tillage' && (
            <Question title="How do you work this field?">
              <div className="space-y-2.5">
                {TILLAGE_OPTIONS.map((o) => (
                  <Choice
                    key={o.value}
                    selected={draft.tillage === o.value}
                    onClick={() => update({ tillage: draft.tillage === o.value ? '' : o.value })}
                    label={o.label}
                    hint={o.hint}
                  />
                ))}
              </div>
              {(draft.tillage === 'reduced' || draft.tillage === 'conventional') && (
                <NumberField
                  label="How deep? (inches)"
                  value={draft.tillageDepth}
                  onChange={(v) => update({ tillageDepth: v })}
                  range={RANGES.tillageDepth}
                  error={errors.tillageDepth}
                />
              )}
            </Question>
          )}

          {step === 'drainage' && (
            <Question title="Does water pond, or does the field dry slowly in spring?">
              <p className="mb-3 text-base text-topsoil/80">Your best guess is fine. It helps us spot compaction.</p>
              <div className="grid grid-cols-3 gap-2">
                {PONDING_OPTIONS.map((o) => (
                  <Choice
                    key={o.value}
                    selected={draft.ponding === o.value}
                    onClick={() => update({ ponding: draft.ponding === o.value ? '' : o.value })}
                    label={o.label}
                    center
                  />
                ))}
              </div>
            </Question>
          )}

          {step === 'yields' && lastCrop && (
            <Question title={`How did ${lastCrop.year} go?`}>
              <NumberField
                label={`Your ${lastCrop.crop.toLowerCase()} yield in ${lastCrop.year} (bushels per acre)`}
                value={draft.lastYield}
                onChange={(v) => update({ lastYield: v })}
                range={RANGES.lastYield}
                error={errors.lastYield}
                hint={
                  lastCrop.crop === 'Corn' && countyCornAvg
                    ? `Lets us compare you with ${countyName}, which has averaged ${countyCornAvg} bu/acre of corn lately.`
                    : `Lets us compare you with ${countyName}.`
                }
              />
            </Question>
          )}

          {step === 'fertilizer' && (
            <Question title="Fertilizer or manure for your next crop?">
              <p className="text-base text-topsoil/80">
                Anything applied since last harvest. Just the product name is enough; rate and date help if you have them.
              </p>
              <div className="mt-3">
                <Choice
                  selected={draft.noneApplied}
                  onClick={() => update({ noneApplied: !draft.noneApplied })}
                  label="Nothing applied yet"
                />
              </div>
              {!draft.noneApplied && (
                <>
                  <div className="mt-3 space-y-3">
                    {draft.amendments.map((a, i) => {
                      const setRow = (patch: Partial<AmendmentDraft>) =>
                        update({ amendments: draft.amendments.map((row, j) => (j === i ? { ...row, ...patch } : row)) });
                      return (
                        <div key={i} className="rounded-2xl bg-sand/35 p-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold">Application {i + 1}</p>
                            <button
                              onClick={() => update({ amendments: draft.amendments.filter((_, j) => j !== i) })}
                              className="flex h-10 w-10 items-center justify-center rounded-full text-rust hover:bg-rust/10"
                              aria-label={`Remove application ${i + 1}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <TextField
                            label="Product"
                            value={a.product}
                            onChange={(v) => setRow({ product: v })}
                            placeholder="e.g. Anhydrous ammonia"
                            error={errors[`product.${i}`]}
                          />
                          <div className="mt-2 grid grid-cols-2 items-start gap-2">
                            <NumberField
                              label="Rate"
                              value={a.rate}
                              onChange={(v) => setRow({ rate: v })}
                              range={RANGES.rate}
                              error={errors[`rate.${i}`]}
                            />
                            <label className="mt-3 block">
                              <span className="text-sm font-medium">Unit</span>
                              <select
                                value={a.unit}
                                onChange={(e) => setRow({ unit: e.target.value })}
                                className="mt-1 min-h-12 w-full rounded-xl bg-cream px-3 text-base ring-1 ring-clay/50"
                              >
                                {UNITS.map((u) => (
                                  <option key={u}>{u}</option>
                                ))}
                              </select>
                            </label>
                          </div>
                          <DateField label="Date applied" value={a.date} onChange={(v) => setRow({ date: v })} />
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={() =>
                      update({ amendments: [...draft.amendments, { product: '', rate: '', unit: 'lb N/ac', date: '' }] })
                    }
                    disabled={draft.amendments.length >= 10}
                    className="mt-3 flex min-h-12 items-center gap-2 rounded-xl px-3 text-base font-semibold text-field-green ring-2 ring-leaf/50 hover:bg-leaf/10"
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                    Add an application
                  </button>
                </>
              )}
            </Question>
          )}

          {step === 'lab' && (
            <Question title="Do you have a lab soil test?">
              <p className="text-base text-topsoil/80">
                Fill in whatever is on your report, even one number. Lab results raise confidence the most.
              </p>
              <DateField
                label="Date sampled"
                value={draft.lab.sampleDate}
                onChange={(v) => updateLab({ sampleDate: v })}
                hint="Recent tests count more. Without a date we treat it as possibly old."
              />
              <div className="mt-1 grid grid-cols-2 items-start gap-2">
                <NumberField label="pH" value={draft.lab.ph} onChange={(v) => updateLab({ ph: v })} range={RANGES.ph} step="0.1" error={errors['lab.ph']} />
                <NumberField label="Buffer pH" value={draft.lab.bufferPh} onChange={(v) => updateLab({ bufferPh: v })} range={RANGES.bufferPh} step="0.1" error={errors['lab.bufferPh']} />
                <NumberField label="Organic matter (%)" value={draft.lab.om} onChange={(v) => updateLab({ om: v })} range={RANGES.om} step="0.1" error={errors['lab.om']} />
                <NumberField label="Nitrate-N (ppm)" value={draft.lab.nitrate} onChange={(v) => updateLab({ nitrate: v })} range={RANGES.nitrate} error={errors['lab.nitrate']} />
                <NumberField label="Phosphorus (ppm)" value={draft.lab.p} onChange={(v) => updateLab({ p: v })} range={RANGES.p} error={errors['lab.p']} />
                <NumberField label="Potassium (ppm)" value={draft.lab.k} onChange={(v) => updateLab({ k: v })} range={RANGES.k} error={errors['lab.k']} />
              </div>
              {draft.lab.p.trim() !== '' && (
                <label className="mt-3 block">
                  <span className="text-sm font-medium">Phosphorus test method</span>
                  <select
                    value={draft.lab.pMethod}
                    onChange={(e) => updateLab({ pMethod: e.target.value as PTestMethod | '' })}
                    className="mt-1 min-h-12 w-full rounded-xl bg-cream px-3 text-base ring-1 ring-clay/50"
                  >
                    <option value="">Not sure</option>
                    {P_METHODS.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                  <span className="mt-1 block text-sm text-topsoil/70">
                    It's on your lab report. Phosphorus & potassium advice needs it.
                  </span>
                </label>
              )}
            </Question>
          )}

          {showErrorSummary && errorKeys.length > 0 && (
            <p className="mt-4 rounded-xl bg-rust/10 px-3 py-2 text-base font-medium text-rust" role="alert">
              Fix the highlighted {errorKeys.length === 1 ? 'value' : 'values'} before saving.
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-clay/30 px-5 py-4">
          {index > 0 && (
            <button
              onClick={() => setIndex(index - 1)}
              className="min-h-12 rounded-xl px-3 text-base font-medium text-topsoil hover:bg-sand/50"
            >
              Back
            </button>
          )}
          <div className="ml-auto flex items-center gap-2">
            {!isLast && (
              <button
                onClick={save}
                className="min-h-12 rounded-xl px-4 text-base font-semibold text-field-green ring-2 ring-leaf/50 hover:bg-leaf/10"
              >
                Done
              </button>
            )}
            <button
              onClick={next}
              className="min-h-12 rounded-xl bg-field-green px-5 text-base font-semibold text-cream hover:brightness-110"
            >
              {isLast ? 'Update my results' : stepHasInput(step, draft) ? 'Next' : 'Skip'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Question({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <span className="mb-1.5 inline-block rounded-full bg-sand px-2.5 py-0.5 text-xs font-semibold text-topsoil">
        Optional
      </span>
      <h2 id="details-title" className="mb-3 font-heading text-2xl leading-tight">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Choice(props: { selected: boolean; onClick: () => void; label: string; hint?: string; center?: boolean }) {
  return (
    <button
      onClick={props.onClick}
      aria-pressed={props.selected}
      className={`flex min-h-14 w-full items-center gap-3 rounded-2xl px-4 py-3 ring-2 transition-colors ${
        props.center ? 'justify-center text-center' : 'text-left'
      } ${props.selected ? 'bg-leaf/15 ring-leaf' : 'ring-clay/40 hover:bg-sand/40'}`}
    >
      <span>
        <span className="block text-base font-semibold">{props.label}</span>
        {props.hint && <span className="block text-sm text-topsoil/75">{props.hint}</span>}
      </span>
      {props.selected && !props.center && <Check className="ml-auto h-5 w-5 shrink-0 text-field-green" aria-hidden />}
    </button>
  );
}

const inputClass = (error?: string) =>
  `mt-1 min-h-12 w-full rounded-xl bg-cream px-3 text-base focus:outline-none focus:ring-2 ${
    error ? 'ring-2 ring-rust focus:ring-rust' : 'ring-1 ring-clay/50 focus:ring-corn-yellow'
  }`;

function FieldMessage({ error, hint }: { error?: string; hint?: string }) {
  if (error) return <span className="mt-1 block text-sm font-medium text-rust">{error}</span>;
  if (hint) return <span className="mt-1 block text-sm text-topsoil/70">{hint}</span>;
  return null;
}

function NumberField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  range: readonly [number, number];
  step?: string;
  hint?: string;
  error?: string;
}) {
  return (
    <label className="mt-3 block">
      <span className="text-sm font-medium">{props.label}</span>
      <input
        type="number"
        inputMode="decimal"
        min={props.range[0]}
        max={props.range[1]}
        step={props.step ?? 'any'}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        // Browsers change a focused number input on scroll; blur so scrolling the form can't edit values.
        onWheel={(e) => e.currentTarget.blur()}
        aria-invalid={Boolean(props.error)}
        className={inputClass(props.error)}
      />
      <FieldMessage error={props.error} hint={props.hint} />
    </label>
  );
}

function TextField(props: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; error?: string }) {
  return (
    <label className="mt-1 block">
      <span className="text-sm font-medium">{props.label}</span>
      <input
        type="text"
        maxLength={60}
        value={props.value}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
        aria-invalid={Boolean(props.error)}
        className={inputClass(props.error)}
      />
      <FieldMessage error={props.error} />
    </label>
  );
}

function DateField(props: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <label className="mt-3 block">
      <span className="text-sm font-medium">{props.label}</span>
      <input type="date" value={props.value} onChange={(e) => props.onChange(e.target.value)} className={inputClass()} />
      <FieldMessage hint={props.hint} />
    </label>
  );
}

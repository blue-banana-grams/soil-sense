import { useEffect, useState, type ReactNode } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import type { Amendment, FarmerDetails, LabTest, PTestMethod, TillageType } from '../types';

const TILLAGE_OPTIONS: { value: TillageType; label: string; hint: string }[] = [
  { value: 'none', label: 'No-till', hint: 'I plant straight into last year’s residue' },
  { value: 'reduced', label: 'Reduced tillage', hint: 'One light pass, most residue stays on top' },
  { value: 'conventional', label: 'Conventional tillage', hint: 'Chisel, disk or plow, little residue left' },
];
const UNITS = ['lb N/ac', 'gal/ac', 'ton/ac', 'lb/ac'];
const P_METHODS: PTestMethod[] = ['Bray-P1', 'Mehlich-3', 'Olsen'];
const STEPS = ['Tillage', 'Yields', 'Fertilizer', 'Soil test'];

interface AmendmentDraft {
  product: string;
  rate: string;
  unit: string;
  date: string;
}

interface Draft {
  tillage: TillageType | '';
  tillageDepth: string;
  yieldGoal: string;
  lastYield: string;
  amendments: AmendmentDraft[];
  lab: Record<'sampleDate' | 'ph' | 'bufferPh' | 'om' | 'p' | 'k' | 'nitrate', string> & { pMethod: PTestMethod | '' };
}

const str = (n: number | undefined | null) => (n === undefined || n === null ? '' : String(n));
const num = (s: string) => (s.trim() === '' ? undefined : Number(s));

function toDraft(d: FarmerDetails, lastYear: number | null): Draft {
  const lab = d.labTest;
  return {
    tillage: d.tillage?.type ?? '',
    tillageDepth: str(d.tillage?.depthIn),
    yieldGoal: str(d.yieldGoalBuAc),
    lastYield: str(d.yieldHistory?.find((y) => y.year === lastYear)?.bushelsPerAcre),
    amendments: (d.amendments ?? []).map((a) => ({ product: a.product, rate: String(a.rate), unit: a.unit, date: a.date })),
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

// Returns the details, or an error message naming the step to fix.
function fromDraft(draft: Draft, lastYear: number | null): { details?: FarmerDetails; error?: { step: number; message: string } } {
  const details: FarmerDetails = {};
  if (draft.tillage) details.tillage = { type: draft.tillage, depthIn: num(draft.tillageDepth) ?? null };

  const goal = num(draft.yieldGoal);
  if (goal !== undefined) details.yieldGoalBuAc = goal;
  const lastYield = num(draft.lastYield);
  if (lastYield !== undefined && lastYear !== null) details.yieldHistory = [{ year: lastYear, bushelsPerAcre: lastYield }];

  const rows = draft.amendments.filter((a) => a.product || a.rate || a.date);
  if (rows.some((a) => !a.product.trim() || num(a.rate) === undefined || !a.date)) {
    return { error: { step: 2, message: 'Fill in product, rate and date for each fertilizer, or remove the row.' } };
  }
  if (rows.length > 0) {
    details.amendments = rows.map<Amendment>((a) => ({
      product: a.product.trim(),
      rate: Number(a.rate),
      unit: a.unit,
      date: a.date,
      method: '',
    }));
  }

  const { lab } = draft;
  const values = [lab.ph, lab.bufferPh, lab.om, lab.p, lab.k, lab.nitrate];
  if (values.some((v) => v.trim() !== '')) {
    if (!lab.sampleDate) return { error: { step: 3, message: 'Add the date your soil was sampled.' } };
    if (lab.p.trim() && !lab.pMethod) {
      return { error: { step: 3, message: 'Pick the phosphorus test method from your lab report.' } };
    }
    const labTest: LabTest = {
      sampleDate: lab.sampleDate,
      ph: num(lab.ph),
      bufferPh: num(lab.bufferPh),
      organicMatterPct: num(lab.om),
      phosphorusPpm: num(lab.p),
      pTestMethod: lab.pMethod || undefined,
      potassiumPpm: num(lab.k),
      nitrateNPpm: num(lab.nitrate),
    };
    details.labTest = labTest;
  }
  return { details };
}

interface DetailsFormProps {
  initial: FarmerDetails;
  lastCrop: { year: number; crop: string } | null;
  countyCornAvg: number | null;
  countyName: string;
  onCancel: () => void;
  onSubmit: (details: FarmerDetails) => void;
}

export function DetailsForm({ initial, lastCrop, countyCornAvg, countyName, onCancel, onSubmit }: DetailsFormProps) {
  const lastYear = lastCrop?.year ?? null;
  const [draft, setDraft] = useState<Draft>(() => toDraft(initial, lastYear));
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const update = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const updateLab = (patch: Partial<Draft['lab']>) => setDraft((d) => ({ ...d, lab: { ...d.lab, ...patch } }));
  const isLast = step === STEPS.length - 1;

  const finish = () => {
    const result = fromDraft(draft, lastYear);
    if (result.error) {
      setStep(result.error.step);
      setError(result.error.message);
      return;
    }
    onSubmit(result.details!);
  };

  const next = () => {
    setError(null);
    if (isLast) finish();
    else setStep(step + 1);
  };

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
              Step {step + 1} of {STEPS.length} · {STEPS[step]}
            </p>
            <div className="mt-1.5 flex gap-1.5" aria-hidden>
              {STEPS.map((s, i) => (
                <span key={s} className={`h-1.5 w-10 rounded-full ${i <= step ? 'bg-leaf' : 'bg-sand'}`} />
              ))}
            </div>
          </div>
          <button
            onClick={onCancel}
            className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-sand/60"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {step === 0 && (
            <Question id="details-title" title="How do you work this field?">
              <div className="space-y-2.5">
                {TILLAGE_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => update({ tillage: draft.tillage === o.value ? '' : o.value })}
                    aria-pressed={draft.tillage === o.value}
                    className={`w-full rounded-2xl px-4 py-3 text-left ring-2 transition-colors ${
                      draft.tillage === o.value ? 'bg-leaf/15 ring-leaf' : 'ring-clay/40 hover:bg-sand/40'
                    }`}
                  >
                    <span className="block text-base font-semibold">{o.label}</span>
                    <span className="block text-sm text-topsoil/75">{o.hint}</span>
                  </button>
                ))}
              </div>
              {(draft.tillage === 'reduced' || draft.tillage === 'conventional') && (
                <NumberField
                  label="How deep? (inches, optional)"
                  value={draft.tillageDepth}
                  onChange={(v) => update({ tillageDepth: v })}
                  min={0}
                  max={24}
                />
              )}
            </Question>
          )}

          {step === 1 && (
            <Question id="details-title" title="What yield are you aiming for?">
              <NumberField
                label="Corn yield goal (bushels per acre)"
                value={draft.yieldGoal}
                onChange={(v) => update({ yieldGoal: v })}
                min={20}
                max={400}
                hint={countyCornAvg ? `${countyName} has averaged ${countyCornAvg} bu/acre over the last 5 years.` : undefined}
              />
              {lastCrop && (lastCrop.crop === 'Corn' || lastCrop.crop === 'Soybeans') && (
                <NumberField
                  label={`Your ${lastCrop.crop.toLowerCase()} yield in ${lastCrop.year} (optional)`}
                  value={draft.lastYield}
                  onChange={(v) => update({ lastYield: v })}
                  min={0}
                  max={400}
                  hint={`Lets us compare you with ${countyName}.`}
                />
              )}
            </Question>
          )}

          {step === 2 && (
            <Question id="details-title" title="Fertilizer or manure for your next crop?">
              <p className="text-base text-topsoil/80">Anything already applied since last harvest. Skip if none yet.</p>
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
                      <TextField label="Product" value={a.product} onChange={(v) => setRow({ product: v })} placeholder="e.g. Anhydrous ammonia" />
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <NumberField label="Rate" value={a.rate} onChange={(v) => setRow({ rate: v })} min={0} max={100000} />
                        <label className="block">
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
                onClick={() => update({ amendments: [...draft.amendments, { product: '', rate: '', unit: 'lb N/ac', date: '' }] })}
                disabled={draft.amendments.length >= 10}
                className="mt-3 flex min-h-12 items-center gap-2 rounded-xl px-3 text-base font-semibold text-field-green ring-2 ring-leaf/50 hover:bg-leaf/10"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Add an application
              </button>
            </Question>
          )}

          {step === 3 && (
            <Question id="details-title" title="Do you have a lab soil test?">
              <p className="text-base text-topsoil/80">
                Copy what's on your report. This raises confidence the most and unlocks lime and fertilizer advice.
              </p>
              <DateField label="Date sampled" value={draft.lab.sampleDate} onChange={(v) => updateLab({ sampleDate: v })} />
              <div className="mt-1 grid grid-cols-2 items-end gap-2">
                <NumberField label="pH" value={draft.lab.ph} onChange={(v) => updateLab({ ph: v })} min={3.5} max={9.5} step="0.1" />
                <NumberField label="Buffer pH" value={draft.lab.bufferPh} onChange={(v) => updateLab({ bufferPh: v })} min={4} max={8} step="0.1" />
                <NumberField label="Organic matter (%)" value={draft.lab.om} onChange={(v) => updateLab({ om: v })} min={0} max={20} step="0.1" />
                <NumberField label="Nitrate-N (ppm)" value={draft.lab.nitrate} onChange={(v) => updateLab({ nitrate: v })} min={0} max={200} />
                <NumberField label="Phosphorus (ppm)" value={draft.lab.p} onChange={(v) => updateLab({ p: v })} min={0} max={500} />
                <NumberField label="Potassium (ppm)" value={draft.lab.k} onChange={(v) => updateLab({ k: v })} min={0} max={1500} />
              </div>
              {draft.lab.p.trim() !== '' && (
                <label className="mt-3 block">
                  <span className="text-sm font-medium">Phosphorus test method</span>
                  <select
                    value={draft.lab.pMethod}
                    onChange={(e) => updateLab({ pMethod: e.target.value as PTestMethod | '' })}
                    className="mt-1 min-h-12 w-full rounded-xl bg-cream px-3 text-base ring-1 ring-clay/50"
                  >
                    <option value="">Pick from your report</option>
                    {P_METHODS.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </label>
              )}
            </Question>
          )}

          {error && (
            <p className="mt-4 rounded-xl bg-rust/10 px-3 py-2 text-base font-medium text-rust" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-clay/30 px-5 py-4">
          {step > 0 && (
            <button
              onClick={() => {
                setError(null);
                setStep(step - 1);
              }}
              className="min-h-12 rounded-xl px-4 text-base font-medium text-topsoil hover:bg-sand/50"
            >
              Back
            </button>
          )}
          <button
            onClick={next}
            className="ml-auto min-h-12 rounded-xl bg-field-green px-5 text-base font-semibold text-cream hover:brightness-110"
          >
            {isLast ? 'Update my results' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Question({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <div>
      <h2 id={id} className="mb-3 font-heading text-2xl leading-tight">
        {title}
      </h2>
      {children}
    </div>
  );
}

const inputClass = 'mt-1 min-h-12 w-full rounded-xl bg-cream px-3 text-base ring-1 ring-clay/50 focus:outline-none focus:ring-2 focus:ring-corn-yellow';

function NumberField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min: number;
  max: number;
  step?: string;
  hint?: string;
}) {
  return (
    <label className="mt-3 block">
      <span className="text-sm font-medium">{props.label}</span>
      <input
        type="number"
        inputMode="decimal"
        min={props.min}
        max={props.max}
        step={props.step ?? 'any'}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        // Browsers change a focused number input on scroll; blur so scrolling the form can't edit values.
        onWheel={(e) => e.currentTarget.blur()}
        className={inputClass}
      />
      {props.hint && <span className="mt-1 block text-sm text-topsoil/70">{props.hint}</span>}
    </label>
  );
}

function TextField(props: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="mt-1 block">
      <span className="text-sm font-medium">{props.label}</span>
      <input
        type="text"
        maxLength={60}
        value={props.value}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
        className={inputClass}
      />
    </label>
  );
}

function DateField(props: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="mt-3 block">
      <span className="text-sm font-medium">{props.label}</span>
      <input type="date" value={props.value} onChange={(e) => props.onChange(e.target.value)} className={inputClass} />
    </label>
  );
}

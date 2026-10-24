import { useEffect, useState } from 'react';
import { CalendarDays, Check, Layers, MapPin, RefreshCw, Sprout, Wheat, type LucideIcon } from 'lucide-react';
import type { FarmerDetails, OverallConfidence, Report } from '../types';
import { errorMessage, fetchReport } from '../lib/api';
import type { ChosenLocation } from '../lib/route';
import { Header } from './Header';
import { LocationMap } from './LocationMap';
import { ConfidenceCard } from './ConfidenceCard';
import { ThisWeekCard } from './ThisWeekCard';
import { ScoreCard } from './ScoreCard';
import { Recommendations } from './Recommendations';
import { RotationPlan } from './RotationPlan';
import { CountyComparison } from './CountyComparison';
import { SeasonCalendar } from './SeasonCalendar';
import { SoilProfile } from './SoilProfile';
import { DetailsForm } from './DetailsForm';

type TabId = 'overview' | 'plan' | 'season' | 'soil';

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Overview', icon: Sprout },
  { id: 'plan', label: 'Plan', icon: Wheat },
  { id: 'season', label: 'Season', icon: CalendarDays },
  { id: 'soil', label: 'Soil', icon: Layers },
];

const LOADING_STEPS = [
  'Finding your county',
  'Reading the USDA soil survey',
  'Checking 5 years of satellite crop records',
  'Pulling 30 years of local weather',
  'Checking county yields and irrigation',
];

// Details are a per-browser convenience; the app works the same without storage.
function loadDetails(key: string): FarmerDetails {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as FarmerDetails) : {};
  } catch {
    return {};
  }
}

function saveDetails(key: string, details: FarmerDetails) {
  try {
    localStorage.setItem(key, JSON.stringify(details));
  } catch {
    // Storage blocked or full: details still apply for this visit.
  }
}

interface ResultsProps {
  location: ChosenLocation;
  embedded: boolean;
  onMove: (location: ChosenLocation) => void;
  onChangeLocation: () => void;
}

export function Results({ location, embedded, onMove, onChangeLocation }: ResultsProps) {
  const { lat, lng, place } = location;
  const storageKey = `soilsense:details:${lat.toFixed(4)},${lng.toFixed(4)}`;
  const [details, setDetails] = useState<FarmerDetails>(() => loadDetails(storageKey));
  const [report, setReport] = useState<Report | null>(null);
  const [previous, setPrevious] = useState<OverallConfidence | null>(null);
  const [status, setStatus] = useState<'loading' | 'updating' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [tab, setTab] = useState<TabId>('overview');

  useEffect(() => {
    let cancelled = false;
    fetchReport({ lat, lng, place, details })
      .then((r) => {
        if (cancelled) return;
        setReport(r);
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(errorMessage(err));
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [lat, lng, place, details, attempt]);

  const moveTo = (newLat: number, newLng: number) => onMove({ lat: newLat, lng: newLng, place });

  const submitDetails = (next: FarmerDetails) => {
    setFormOpen(false);
    setPrevious(report?.confidence ?? null);
    setStatus(report ? 'updating' : 'loading');
    saveDetails(storageKey, next);
    setDetails(next);
    setTab('overview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const header = (
    <Header homeHref={embedded ? '/?embed=1' : '/'}>
      <button
        onClick={onChangeLocation}
        className="flex min-h-11 items-center gap-2 rounded-xl bg-cream/10 px-3 text-sm font-medium text-cream ring-1 ring-cream/25 hover:bg-cream/20"
      >
        <MapPin className="h-4 w-4" aria-hidden />
        Change location
      </button>
    </Header>
  );

  if (status === 'loading' || (status === 'error' && !report)) {
    return (
      <div className="min-h-svh bg-cream">
        {header}
        <main className="mx-auto max-w-xl px-4 py-8">
          {status === 'loading' ? (
            <LoadingChecklist place={place} />
          ) : (
            <div className="space-y-4">
              <p className="rounded-2xl bg-rust/10 p-4 text-base font-medium text-rust" role="alert">
                {error}
              </p>
              <div className="isolate h-64 overflow-hidden rounded-2xl ring-1 ring-clay/40">
                <LocationMap lat={lat} lng={lng} onMove={moveTo} />
              </div>
              <p className="text-sm text-topsoil/70">Tap a nearby field on the map to try that spot instead.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setStatus('loading');
                    setAttempt((a) => a + 1);
                  }}
                  className="flex min-h-12 items-center gap-2 rounded-xl bg-field-green px-4 text-base font-semibold text-cream"
                >
                  <RefreshCw className="h-4 w-4" aria-hidden />
                  Try again
                </button>
                <button
                  onClick={onChangeLocation}
                  className="min-h-12 rounded-xl px-4 text-base font-medium text-topsoil ring-2 ring-clay/50"
                >
                  Pick a different place
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  if (!report) return null;

  const hasAllDetails = Boolean(details.tillage && details.yieldGoalBuAc && details.labTest);
  const lastCrop = report.cropHistory.value.at(-1) ?? null;
  const unavailable = report.sources.filter((s) => !s.ok).map((s) => s.name);

  return (
    <div className="min-h-svh bg-cream">
      {header}
      <main className="mx-auto grid max-w-6xl gap-5 px-4 py-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:px-6">
        <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <div>
            <h1 className="font-heading text-3xl leading-tight">{report.place}</h1>
            <p className="text-base text-topsoil/75">
              {report.location.label} · {report.soil.componentName} soil
            </p>
          </div>
          <div className="isolate h-56 overflow-hidden rounded-2xl ring-1 ring-clay/40 sm:h-64">
            <LocationMap lat={lat} lng={lng} onMove={moveTo} />
          </div>
          <p className="-mt-2 text-sm text-topsoil/70">Not exactly your field? Tap it on the map to move the pin.</p>
          {report.farmlandWarning && (
            <p className="rounded-2xl bg-rust px-4 py-3 text-base font-medium text-cream" role="alert">
              {report.farmlandWarning}
            </p>
          )}
          <ConfidenceCard
            confidence={report.confidence}
            previous={previous}
            canImprove
            improveLabel={hasAllDetails ? 'Edit your field details' : 'Raise your confidence'}
            onImprove={() => setFormOpen(true)}
          />
        </div>

        <div className={status === 'updating' ? 'pointer-events-none opacity-60 transition-opacity' : ''}>
          {status === 'updating' && (
            <p className="mb-3 rounded-xl bg-corn-yellow/30 px-4 py-2 text-base font-medium" role="status">
              Updating with your details…
            </p>
          )}
          {status === 'error' && (
            <p className="mb-3 rounded-xl bg-rust/10 px-4 py-2 text-base font-medium text-rust" role="alert">
              {error}
            </p>
          )}

          <nav
            className="sticky top-0 z-10 -mx-4 grid grid-cols-4 gap-1 bg-cream/95 px-4 py-2 backdrop-blur lg:mx-0 lg:px-0"
            role="tablist"
          >
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(id)}
                  className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-sm font-medium transition-colors ${
                    active ? 'bg-topsoil text-cream' : 'text-topsoil hover:bg-sand/60'
                  }`}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                  {label}
                </button>
              );
            })}
          </nav>

          <div className="mt-3 space-y-4" role="tabpanel">
            {tab === 'overview' && (
              <>
                <div className="rounded-2xl bg-topsoil p-4 text-cream sm:p-5">
                  <p className="font-heading text-lg">What this means for you</p>
                  <p className="mt-1 text-base leading-relaxed text-cream/95">{report.aiExplanation}</p>
                </div>
                {report.thisWeek && <ThisWeekCard week={report.thisWeek} />}
                <ScoreCard score={report.score} />
                <Recommendations items={report.recommendations} />
              </>
            )}
            {tab === 'plan' && (
              <>
                <RotationPlan plan={report.rotation} />
                {report.countyBenchmark ? (
                  <CountyComparison benchmark={report.countyBenchmark} />
                ) : (
                  report.countyCornYieldAvg && (
                    <div className="rounded-2xl border border-clay/40 bg-cream p-4">
                      <p className="font-heading text-lg">{report.location.countyName} yields</p>
                      <p className="mt-1 text-base">
                        Corn here has averaged {report.countyCornYieldAvg} bu/acre over the last 5 years (USDA NASS).
                        Add last season's yield to see how you compare.
                      </p>
                    </div>
                  )
                )}
              </>
            )}
            {tab === 'season' &&
              (report.calendar ? (
                <SeasonCalendar calendar={report.calendar} />
              ) : (
                <p className="rounded-2xl bg-sand/40 p-4 text-base">
                  Local weather history isn't available right now, so we can't build your season calendar. Try again
                  in a minute.
                </p>
              ))}
            {tab === 'soil' && <SoilProfile report={report} />}
          </div>

          {unavailable.length > 0 && (
            <p className="mt-6 text-sm text-topsoil/70">
              Not available right now: {unavailable.join(', ')}. Results use everything else.
            </p>
          )}
        </div>
      </main>

      {formOpen && (
        <DetailsForm
          initial={details}
          lastCrop={lastCrop}
          countyCornAvg={report.countyCornYieldAvg}
          countyName={report.location.countyName}
          onCancel={() => setFormOpen(false)}
          onSubmit={submitDetails}
        />
      )}
    </div>
  );
}

function LoadingChecklist({ place }: { place?: string }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1)), 1200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="rounded-2xl bg-topsoil p-6 text-cream" role="status" aria-live="polite">
      <p className="font-heading text-2xl">Looking up {place ? `your field near ${place}` : 'your field'}…</p>
      <ul className="mt-4 space-y-3">
        {LOADING_STEPS.map((label, i) => (
          <li key={label} className={`flex items-center gap-3 text-base ${i > step ? 'opacity-40' : ''}`}>
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cream/15">
              {i < step ? (
                <Check className="h-4 w-4 text-corn-yellow" aria-hidden />
              ) : i === step ? (
                <span className="h-3 w-3 animate-pulse rounded-full bg-corn-yellow" />
              ) : null}
            </span>
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

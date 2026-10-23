import { useEffect, useState } from 'react';
import { Smartphone, Sprout } from 'lucide-react';
import { MapView } from './components/MapView';
import { FieldPanel } from './components/FieldPanel';
import { FieldList } from './components/FieldList';
import { fetchFieldDetail, fetchFields } from './lib/api';
import type { FieldDetail, FieldSummary } from './types';

function App({ embedded = false }: { embedded?: boolean }) {
  const [fields, setFields] = useState<FieldSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fieldDetail, setFieldDetail] = useState<FieldDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFields()
      .then(setFields)
      .catch(() => setError('Could not load your fields. Is the server running?'));
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setFieldDetail(null);
      return;
    }
    setLoadingDetail(true);
    fetchFieldDetail(selectedId)
      .then(setFieldDetail)
      .catch(() => setError('Could not load that field.'))
      .finally(() => setLoadingDetail(false));
  }, [selectedId]);

  return (
    <div className="flex h-svh flex-col">
      <header className="field-rows flex items-center justify-between gap-3 bg-soil-dark px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-leaf/90 text-cream">
            <Sprout className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h1 className="font-heading text-xl leading-tight text-cream">SoilSense</h1>
            <p className="text-xs text-sand/85">
              How healthy is your topsoil? · Story County, Iowa
            </p>
          </div>
        </div>
        {!embedded && (
          <a
            href="/?view=phone"
            className="flex min-h-11 items-center gap-2 rounded-xl bg-cream/10 px-3 text-sm font-medium text-cream ring-1 ring-cream/25 hover:bg-cream/20"
          >
            <Smartphone className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Phone preview</span>
          </a>
        )}
      </header>

      {error && (
        <p className="bg-rust px-4 py-2 text-sm font-medium text-cream" role="alert">
          {error}
        </p>
      )}

      <main className="relative flex-1">
        <MapView fields={fields} selectedId={selectedId} onSelect={setSelectedId} />

        {fields.length > 0 && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[1000] sm:inset-x-auto sm:bottom-auto sm:left-14 sm:top-3 sm:w-72">
            <FieldList fields={fields} selectedId={selectedId} onSelect={setSelectedId} />
          </div>
        )}

        <FieldPanel
          field={fieldDetail}
          loading={loadingDetail}
          onClose={() => setSelectedId(null)}
        />
      </main>
    </div>
  );
}

export default App;

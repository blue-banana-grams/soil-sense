import { useEffect, useState } from 'react';
import { MapView } from './components/MapView';
import { FieldPanel } from './components/FieldPanel';
import { fetchFieldDetail, fetchFields } from './lib/api';
import type { FieldDetail, FieldSummary } from './types';

function App() {
  const [fields, setFields] = useState<FieldSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fieldDetail, setFieldDetail] = useState<FieldDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFields()
      .then(setFields)
      .catch(() => setError('Could not load fields from the API.'));
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setFieldDetail(null);
      return;
    }
    setLoadingDetail(true);
    fetchFieldDetail(selectedId)
      .then(setFieldDetail)
      .catch(() => setError('Could not load field detail.'))
      .finally(() => setLoadingDetail(false));
  }, [selectedId]);

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-clay/40 bg-soil-dark px-5 py-3">
        <div>
          <h1 className="font-heading text-xl text-cream">SoilSense</h1>
          <p className="text-xs text-sand/80">
            Topsoil health &amp; rotation planning — Story County, Iowa
          </p>
        </div>
        {error && <p className="text-sm text-rust">{error}</p>}
      </header>

      <main className="relative flex-1">
        <MapView
          fields={fields}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
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

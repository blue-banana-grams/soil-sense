import { useEffect, useRef, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import type { GeocodeResult } from '../types';
import { errorMessage, searchPlaces } from '../lib/api';

interface LocationSearchProps {
  onChoose: (place: GeocodeResult) => void;
}

export function LocationSearch({ onChoose }: LocationSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [status, setStatus] = useState<'idle' | 'searching' | 'empty' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const latest = useRef(0);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setStatus('idle');
      return;
    }
    const id = ++latest.current;
    setStatus('searching');
    const timer = setTimeout(() => {
      searchPlaces(q)
        .then((found) => {
          if (id !== latest.current) return;
          setResults(found);
          setStatus(found.length ? 'idle' : 'empty');
        })
        .catch((err) => {
          if (id !== latest.current) return;
          setError(errorMessage(err));
          setStatus('error');
        });
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (results[0]) onChoose(results[0]);
        }}
      >
        <label htmlFor="place-search" className="sr-only">
          Town or ZIP code
        </label>
        <div className="flex items-center gap-2 rounded-2xl bg-cream px-4 shadow-lg ring-2 ring-clay/50 focus-within:ring-corn-yellow">
          <Search className="h-5 w-5 shrink-0 text-topsoil/60" aria-hidden />
          <input
            id="place-search"
            type="text"
            inputMode="search"
            autoComplete="off"
            placeholder="Town or ZIP code"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-h-14 w-full bg-transparent text-lg text-soil-dark outline-none placeholder:text-topsoil/50"
          />
        </div>
      </form>

      {(results.length > 0 || status === 'empty' || status === 'error') && (
        <ul className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl bg-cream shadow-xl ring-1 ring-clay/40">
          {results.map((r) => (
            <li key={`${r.lat},${r.lng}`}>
              <button
                type="button"
                onClick={() => onChoose(r)}
                className="flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left hover:bg-sand/50"
              >
                <MapPin className="h-5 w-5 shrink-0 text-subsoil" aria-hidden />
                <span>
                  <span className="block text-base font-medium text-soil-dark">{r.label}</span>
                  {r.detail && <span className="block text-sm text-topsoil/70">{r.detail}</span>}
                </span>
              </button>
            </li>
          ))}
          {status === 'empty' && (
            <li className="px-4 py-3 text-base text-topsoil/80">
              No match in the lower 48 states. Try a nearby town or a ZIP code.
            </li>
          )}
          {status === 'error' && <li className="px-4 py-3 text-base text-rust">{error}</li>}
        </ul>
      )}
    </div>
  );
}

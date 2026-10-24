import { useState } from 'react';
import { LocateFixed, Smartphone, Sprout } from 'lucide-react';
import { Header } from './Header';
import { LocationSearch } from './LocationSearch';
import type { ChosenLocation } from '../lib/route';

// A real cornfield northwest of Ames, Iowa, used for the "Try an example" button.
const EXAMPLE: ChosenLocation = { lat: 42.07, lng: -93.65, place: 'Ames, Iowa' };

interface LandingProps {
  embedded: boolean;
  onChoose: (location: ChosenLocation) => void;
}

export function Landing({ embedded, onChoose }: LandingProps) {
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const useMyLocation = () => {
    if (!('geolocation' in navigator)) {
      setGeoError("This browser can't share your location. Type a town or ZIP code instead.");
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        onChoose({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setLocating(false);
        setGeoError("Couldn't get your location. Type a town or ZIP code instead.");
      },
      { enableHighAccuracy: true, timeout: 15_000 },
    );
  };

  return (
    <div className="flex min-h-svh flex-col bg-cream">
      <Header homeHref={embedded ? '/?embed=1' : '/'}>
        {!embedded && (
          <a
            href="/?view=phone"
            className="flex min-h-11 items-center gap-2 rounded-xl bg-cream/10 px-3 text-sm font-medium text-cream ring-1 ring-cream/25 hover:bg-cream/20"
          >
            <Smartphone className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Phone preview</span>
          </a>
        )}
      </Header>

      <main className="field-rows flex flex-1 flex-col items-center bg-topsoil px-4 pb-16 pt-12 sm:pt-20">
        <div className="w-full max-w-xl text-center text-cream">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-leaf text-cream">
            <Sprout className="h-8 w-8" aria-hidden />
          </span>
          <h1 className="mt-6 font-heading text-4xl leading-tight sm:text-5xl">How healthy is your topsoil?</h1>
          <p className="mt-4 text-lg text-sand/90">
            Tell us where your field is. We'll check USDA soil maps, satellite crop records and local
            weather, free.
          </p>
        </div>

        <div className="mt-8 w-full max-w-xl">
          <LocationSearch onChoose={(p) => onChoose({ lat: p.lat, lng: p.lng, place: p.label })} />

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={useMyLocation}
              disabled={locating}
              className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-corn-yellow px-4 text-base font-semibold text-soil-dark shadow-md hover:brightness-105 disabled:opacity-70"
            >
              <LocateFixed className="h-5 w-5" aria-hidden />
              {locating ? 'Finding you…' : 'Use my location'}
            </button>
            <button
              onClick={() => onChoose(EXAMPLE)}
              className="flex min-h-14 flex-1 items-center justify-center rounded-2xl px-4 text-base font-medium text-cream ring-2 ring-cream/40 hover:bg-cream/10"
            >
              Try an example (Ames, Iowa)
            </button>
          </div>
          {geoError && (
            <p className="mt-3 rounded-xl bg-rust/90 px-4 py-2 text-base text-cream" role="alert">
              {geoError}
            </p>
          )}
          <p className="mt-6 text-center text-sm text-sand/80">
            Works anywhere in the lower 48 states. No account needed.
          </p>
        </div>
      </main>
    </div>
  );
}

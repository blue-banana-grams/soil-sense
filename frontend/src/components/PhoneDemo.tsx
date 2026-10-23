import { useEffect, useState } from 'react';
import { ArrowLeft, Sprout } from 'lucide-react';

const SCREEN = { width: 390, height: 844 };
const BEZEL = 14;
const STATUS_BAR = 47;
const FRAME = { width: SCREEN.width + BEZEL * 2, height: SCREEN.height + BEZEL * 2 };

function fitScale(margin: number): number {
  return Math.min(1, (window.innerHeight - margin) / FRAME.height);
}

function useFitScale(margin: number): number {
  const [scale, setScale] = useState(() => fitScale(margin));
  useEffect(() => {
    const onResize = () => setScale(fitScale(margin));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [margin]);
  return scale;
}

const STEPS = [
  'Tap a field on the map, or pick one from "Your fields".',
  'See your topsoil health score and what is driving it.',
  'Follow the plan: what to plant, when, and what to fix first.',
];

export function PhoneDemo() {
  const scale = useFitScale(48);

  return (
    <div className="field-rows flex min-h-svh flex-col items-center justify-center gap-10 bg-soil-dark px-4 py-6 lg:flex-row lg:gap-20">
      <div className="max-w-md text-cream">
        <a
          href="/"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl px-1 text-sm font-medium text-sand hover:text-cream"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Open the full map
        </a>
        <div className="mt-4 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-leaf text-cream">
            <Sprout className="h-7 w-7" aria-hidden />
          </span>
          <p className="font-heading text-2xl">SoilSense</p>
        </div>
        <h1 className="mt-6 font-heading text-4xl leading-tight sm:text-5xl">
          Your topsoil, in your pocket.
        </h1>
        <p className="mt-4 text-lg text-sand/90">
          This is the live app at phone size. Tap around inside the phone to try it.
        </p>
        <ol className="mt-6 space-y-3">
          {STEPS.map((step, i) => (
            <li key={step} className="flex gap-3 text-base text-cream/95">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-corn-yellow text-sm font-bold text-soil-dark">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      <div style={{ width: FRAME.width * scale, height: FRAME.height * scale }} className="shrink-0">
        <div
          className="relative rounded-[3.4rem] bg-[#141414] shadow-2xl ring-2 ring-[#3a3a3a]"
          style={{
            width: FRAME.width,
            height: FRAME.height,
            padding: BEZEL,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <div className="relative h-full w-full overflow-hidden rounded-[2.6rem] bg-soil-dark">
            <div
              className="flex items-center justify-between px-8 text-sm font-semibold text-cream"
              style={{ height: STATUS_BAR }}
            >
              <span>9:41</span>
              <span className="flex items-center gap-1.5" aria-hidden>
                <span className="flex items-end gap-0.5">
                  {[4, 6, 8, 10].map((h) => (
                    <span key={h} className="w-[3px] rounded-sm bg-cream" style={{ height: h }} />
                  ))}
                </span>
                <span className="ml-1 h-3 w-6 rounded-[4px] border border-cream/80 p-[1.5px]">
                  <span className="block h-full w-4/5 rounded-[2px] bg-cream" />
                </span>
              </span>
            </div>
            <div className="absolute left-1/2 top-2.5 h-8 w-32 -translate-x-1/2 rounded-full bg-black" aria-hidden />
            <iframe
              src="/?embed=1"
              title="SoilSense running on a phone"
              className="block w-full border-0"
              style={{ height: SCREEN.height - STATUS_BAR }}
            />
            <div
              className="pointer-events-none absolute bottom-2 left-1/2 h-1.5 w-36 -translate-x-1/2 rounded-full bg-soil-dark/70"
              aria-hidden
            />
          </div>
        </div>
      </div>
    </div>
  );
}

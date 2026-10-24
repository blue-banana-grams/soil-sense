import type { ReactNode } from 'react';
import { Sprout } from 'lucide-react';

export function Header({ homeHref = '/', children }: { homeHref?: string; children?: ReactNode }) {
  return (
    <header className="field-rows flex items-center justify-between gap-3 bg-soil-dark px-4 py-3 sm:px-6">
      <a href={homeHref} className="flex items-center gap-3" aria-label="SoilSense home">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-leaf/90 text-cream">
          <Sprout className="h-6 w-6" aria-hidden />
        </span>
        <span className="font-heading text-xl leading-tight text-cream">SoilSense</span>
      </a>
      {children}
    </header>
  );
}

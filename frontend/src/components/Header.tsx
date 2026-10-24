import type { ReactNode } from 'react';

export function Header({ homeHref = '/', children }: { homeHref?: string; children?: ReactNode }) {
  return (
    <header className="field-rows flex items-center justify-between gap-3 bg-soil-dark px-4 py-3 sm:px-6">
      <a href={homeHref} className="flex items-center gap-3" aria-label="SoilSense home">
        <img src="/logo.png" alt="" className="h-11 w-11 shrink-0" />
        <span className="font-heading text-xl leading-tight text-cream">SoilSense</span>
      </a>
      {children}
    </header>
  );
}

import { ExternalLink, Wrench } from 'lucide-react';
import type { FixGroup } from '../types';

export function HowToFix({ groups }: { groups: FixGroup[] }) {
  if (groups.length === 0) return null;

  return (
    <section className="space-y-3" aria-labelledby="how-to-fix">
      <div className="px-1">
        <p id="how-to-fix" className="font-heading text-lg">
          How to fix it
        </p>
        <p className="text-sm text-topsoil/70">Each problem above, with practices backed by research or USDA standards.</p>
      </div>

      {groups.map((group) => (
        <div key={group.key} className="rounded-2xl border border-clay/40 bg-cream p-4">
          <p className="text-sm font-medium uppercase tracking-wide text-rust">The problem</p>
          <ul className="mt-1 space-y-1">
            {group.problems.map((problem) => (
              <li key={problem} className="text-base font-medium">
                {problem}
              </li>
            ))}
          </ul>

          <ul className="mt-3 space-y-3">
            {group.practices.map((practice) => (
              <li key={practice.title} className="rounded-xl bg-sand/35 p-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-leaf/20 text-field-green">
                    <Wrench className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-base font-semibold">{practice.title}</p>
                    <p className="text-base text-soil-dark/90">{practice.what}</p>
                  </div>
                </div>
                <ul className="mt-2 space-y-2 border-l-2 border-leaf/40 pl-3">
                  {practice.evidence.map((ev) => (
                    <li key={ev.url + ev.claim} className="text-sm">
                      <span className="text-soil-dark/90">{ev.claim}</span>{' '}
                      <a
                        href={ev.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-field-green underline underline-offset-2"
                      >
                        {ev.source}
                        <ExternalLink className="h-3 w-3" aria-hidden />
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <p className="px-1 text-xs text-topsoil/60">
        Sources checked October 2026. Talk with your agronomist or local NRCS office before making big changes.
      </p>
    </section>
  );
}

import type { CountyBenchmark } from '../types';

export function CountyComparison({ benchmark }: { benchmark: CountyBenchmark }) {
  return (
    <div className="rounded-2xl border border-clay/40 bg-cream p-4">
      <p className="font-heading text-lg">Your yields vs {benchmark.county}</p>
      <p className="mt-1 text-base font-medium">{benchmark.summary}</p>

      <table className="mt-3 w-full text-left">
        <thead>
          <tr className="text-xs font-medium uppercase tracking-wide text-topsoil/60">
            <th className="pb-1.5 font-medium">Year</th>
            <th className="pb-1.5 text-right font-medium">You</th>
            <th className="pb-1.5 text-right font-medium">County</th>
            <th className="pb-1.5 text-right font-medium">Diff</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-clay/25">
          {benchmark.years.map((y) => {
            const diff = y.fieldBuAc - y.countyBuAc;
            const ahead = diff >= 0;
            return (
              <tr key={`${y.year}-${y.crop}`} className="text-base">
                <td className="py-2">
                  {y.year}
                  <span className="block text-xs text-topsoil/60">{y.crop}</span>
                </td>
                <td className="py-2 text-right font-semibold">{y.fieldBuAc}</td>
                <td className="py-2 text-right">{y.countyBuAc}</td>
                <td className={`py-2 text-right font-semibold ${ahead ? 'text-field-green' : 'text-rust'}`}>
                  {ahead ? '+' : '−'}
                  {Math.abs(diff).toFixed(1)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="mt-2 text-xs text-topsoil/60">
        Bushels per acre. County averages: {benchmark.source}.
      </p>
    </div>
  );
}

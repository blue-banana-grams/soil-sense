const SHORT_DATE = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

export function shortDate(isoDate: string): string {
  return SHORT_DATE.format(new Date(isoDate));
}

export function dateRange(range: { start: string; end: string }): string {
  return `${shortDate(range.start)} – ${shortDate(range.end)}`;
}

export function dayOfYear(isoDate: string): number {
  const date = new Date(isoDate);
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  return Math.floor((date.getTime() - start) / 86_400_000);
}

export const RUNOFF_RISK: Record<string, string> = {
  A: 'Low runoff',
  B: 'Moderately low runoff',
  C: 'Moderately high runoff',
  D: 'High runoff',
};

export interface ChosenLocation {
  lat: number;
  lng: number;
  place?: string;
}

export function readLocation(search: string): ChosenLocation | null {
  const params = new URLSearchParams(search);
  const lat = Number(params.get('lat'));
  const lng = Number(params.get('lng'));
  if (!params.has('lat') || !params.has('lng') || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng, place: params.get('place') ?? undefined };
}

export function locationUrl(loc: ChosenLocation | null, embedded: boolean): string {
  const params = new URLSearchParams();
  if (embedded) params.set('embed', '1');
  if (loc) {
    params.set('lat', loc.lat.toFixed(5));
    params.set('lng', loc.lng.toFixed(5));
    if (loc.place) params.set('place', loc.place);
  }
  const query = params.toString();
  return query ? `/?${query}` : '/';
}

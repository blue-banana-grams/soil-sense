import type { FarmerDetails } from '../types';

// Farmer answers are a per-browser convenience kept in localStorage, one entry per
// location. Every access is guarded: storage can be blocked, full or unavailable.
const PREFIX = 'soilsense:details:';

export function answersKey(lat: number, lng: number): string {
  return `${PREFIX}${lat.toFixed(4)},${lng.toFixed(4)}`;
}

export function loadAnswers(key: string): FarmerDetails {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as FarmerDetails) : {};
  } catch {
    return {};
  }
}

export function saveAnswers(key: string, details: FarmerDetails) {
  try {
    if (Object.keys(details).length === 0) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(details));
  } catch {
    // Storage blocked or full: answers still apply for this visit.
  }
}

function savedKeys(): string[] {
  try {
    return Object.keys(localStorage).filter((k) => k.startsWith(PREFIX));
  } catch {
    return [];
  }
}

export function countSavedPlaces(): number {
  return savedKeys().length;
}

export function clearAllAnswers() {
  try {
    for (const key of savedKeys()) localStorage.removeItem(key);
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}

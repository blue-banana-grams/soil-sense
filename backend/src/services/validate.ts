import type {
  Amendment,
  FarmerDetails,
  LabTest,
  PondingFrequency,
  PTestMethod,
  Tillage,
  YieldEntry,
} from '../types.js';
import { inLower48Box } from './geo.js';

export class ValidationError extends Error {}

const TILLAGE_TYPES = ['none', 'reduced', 'conventional'] as const;
const PONDING: PondingFrequency[] = ['never', 'sometimes', 'often'];
const P_METHODS: PTestMethod[] = ['Bray-P1', 'Mehlich-3', 'Olsen'];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

function number(v: unknown, name: string, min: number, max: number): number {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) {
    throw new ValidationError(`${name} must be a number from ${min} to ${max}.`);
  }
  return v;
}

function optionalNumber(v: unknown, name: string, min: number, max: number): number | undefined {
  return v === undefined || v === null ? undefined : number(v, name, min, max);
}

function text(v: unknown, name: string, maxLength: number): string {
  if (typeof v !== 'string' || v.trim().length === 0 || v.length > maxLength) {
    throw new ValidationError(`${name} must be text up to ${maxLength} characters.`);
  }
  return v.trim();
}

function date(v: unknown, name: string): string {
  if (typeof v !== 'string' || !ISO_DATE.test(v) || Number.isNaN(Date.parse(v))) {
    throw new ValidationError(`${name} must be a date like 2026-04-15.`);
  }
  return v;
}

function list<T>(v: unknown, name: string, max: number, parse: (item: unknown, i: number) => T): T[] {
  if (!Array.isArray(v) || v.length > max) throw new ValidationError(`${name} must be a list of up to ${max} items.`);
  return v.map(parse);
}

function parseTillage(v: unknown): Tillage {
  if (!isObj(v) || !TILLAGE_TYPES.includes(v.type as Tillage['type'])) {
    throw new ValidationError('Tillage type must be none, reduced or conventional.');
  }
  return { type: v.type as Tillage['type'], depthIn: optionalNumber(v.depthIn, 'Tillage depth', 0, 24) ?? null };
}

// Only the product is required; rate, unit and date are optional.
function parseAmendment(v: unknown, i: number): Amendment {
  if (!isObj(v)) throw new ValidationError(`Fertilizer entry ${i + 1} is not valid.`);
  return {
    product: text(v.product, 'Product', 60),
    rate: optionalNumber(v.rate, 'Rate', 0, 100_000) ?? null,
    unit: v.unit == null || v.unit === '' ? '' : text(v.unit, 'Unit', 20),
    date: v.date == null || v.date === '' ? null : date(v.date, 'Application date'),
    method: typeof v.method === 'string' ? v.method.slice(0, 40) : '',
  };
}

function parseYield(v: unknown): YieldEntry {
  if (!isObj(v)) throw new ValidationError('Yield entry is not valid.');
  return {
    year: number(v.year, 'Yield year', 2000, 2100),
    bushelsPerAcre: number(v.bushelsPerAcre, 'Yield', 0, 400),
  };
}

// Every field is optional. Returns undefined when no values were given.
function parseLabTest(v: unknown): LabTest | undefined {
  if (!isObj(v)) throw new ValidationError('Lab test is not valid.');
  const pTestMethod = v.pTestMethod;
  if (pTestMethod != null && pTestMethod !== '' && !P_METHODS.includes(pTestMethod as PTestMethod)) {
    throw new ValidationError('Phosphorus test method must be Bray-P1, Mehlich-3 or Olsen.');
  }
  const lab: LabTest = {
    sampleDate: v.sampleDate == null || v.sampleDate === '' ? undefined : date(v.sampleDate, 'Sample date'),
    ph: optionalNumber(v.ph, 'pH', 3.5, 9.5),
    bufferPh: optionalNumber(v.bufferPh, 'Buffer pH', 4, 8),
    organicMatterPct: optionalNumber(v.organicMatterPct, 'Organic matter', 0, 20),
    phosphorusPpm: optionalNumber(v.phosphorusPpm, 'Phosphorus', 0, 500),
    potassiumPpm: optionalNumber(v.potassiumPpm, 'Potassium', 0, 1500),
    pTestMethod: pTestMethod ? (pTestMethod as PTestMethod) : undefined,
    nitrateNPpm: optionalNumber(v.nitrateNPpm, 'Nitrate-N', 0, 200),
  };
  const hasValue = [lab.ph, lab.bufferPh, lab.organicMatterPct, lab.phosphorusPpm, lab.potassiumPpm, lab.nitrateNPpm].some(
    (x) => x !== undefined,
  );
  return hasValue ? lab : undefined;
}

function parsePonding(v: unknown): PondingFrequency {
  if (!PONDING.includes(v as PondingFrequency)) {
    throw new ValidationError('Ponding must be never, sometimes or often.');
  }
  return v as PondingFrequency;
}

export interface ReportRequest {
  lat: number;
  lng: number;
  place?: string;
  details: FarmerDetails;
}

export function parseReportRequest(body: unknown): ReportRequest {
  if (!isObj(body)) throw new ValidationError('Request body must be JSON.');
  const lat = number(body.lat, 'Latitude', -90, 90);
  const lng = number(body.lng, 'Longitude', -180, 180);
  if (!inLower48Box(lat, lng)) {
    throw new ValidationError('That spot is outside the lower 48 US states. Pick a spot in the continental US.');
  }
  const place = body.place === undefined || body.place === null ? undefined : text(body.place, 'Place name', 80);

  const d = body.details === undefined || body.details === null ? {} : body.details;
  if (!isObj(d)) throw new ValidationError('Details must be an object.');
  const details: FarmerDetails = {
    tillage: d.tillage == null ? undefined : parseTillage(d.tillage),
    yieldGoalBuAc: optionalNumber(d.yieldGoalBuAc, 'Yield goal', 20, 400),
    amendments: d.amendments == null ? undefined : list(d.amendments, 'Fertilizer', 10, parseAmendment),
    yieldHistory: d.yieldHistory == null ? undefined : list(d.yieldHistory, 'Yields', 10, parseYield),
    labTest: d.labTest == null ? undefined : parseLabTest(d.labTest),
    pondingOrSlowDrying: d.pondingOrSlowDrying == null ? undefined : parsePonding(d.pondingOrSlowDrying),
  };
  return { lat, lng, place, details };
}

import type { CropHistoryEntry, FieldRecord, Measured, YieldEntry } from '../types.js';

// Mock data for Story County, IA, standing in for the real join of
// USDA SSURGO (soil) + farmer-entered management + NASS Quick Stats (yields).
// Swap fetchStoryCountyFields() for real API calls once the data pipeline is
// ready — the shape of FieldRecord stays the same.

function ssurgo<T>(value: T, unit?: string): Measured<T> {
  return { value, tier: 'auto', unit, method: 'SSURGO (Soil Data Access)' };
}

function farmer<T>(value: T, unit?: string): Measured<T> {
  return { value, tier: 'farmer_entry', unit };
}

function history(crops: [number, string][]): Measured<CropHistoryEntry[]> {
  return farmer(crops.map(([year, crop]) => ({ year, crop })));
}

function yields(entries: [number, number][]): Measured<YieldEntry[]> {
  return farmer(
    entries.map(([year, bushelsPerAcre]) => ({ year, bushelsPerAcre })),
    'bu/ac',
  );
}

export const STORY_COUNTY_FIELDS: FieldRecord[] = [
  {
    id: 'field-1',
    name: 'North Homestead 80',
    lat: 42.0558,
    lng: -93.4891,
    acres: 80,
    soil: {
      mapUnitComponent: 'Clarion loam, eroded',
      organicMatterPct: {
        value: 2.1,
        tier: 'lab',
        unit: '%',
        method: 'Loss on ignition',
        sampleDate: '2025-03-15',
      },
      topsoilDepthIn: ssurgo(6, 'in'),
      slopePct: ssurgo(7.5, '%'),
      erosionClass: ssurgo('Severe'),
      drainageClass: ssurgo('Well drained'),
      hydrologicGroup: ssurgo('B'),
      ph: ssurgo(6.4, 'pH'),
      cecMeq100g: ssurgo(18, 'meq/100g'),
      texture: ssurgo('loam'),
    },
    cropHistory: history([
      [2021, 'Corn'],
      [2022, 'Corn'],
      [2023, 'Corn'],
      [2024, 'Corn'],
      [2025, 'Corn'],
    ]),
    yieldHistory: yields([
      [2021, 182],
      [2022, 174],
      [2023, 168],
      [2024, 159],
      [2025, 151],
    ]),
    management: {
      tillage: farmer({ type: 'conventional', depthIn: 7 }),
      yieldGoalBuAc: farmer(190, 'bu/ac'),
      amendments: farmer([
        {
          product: 'Anhydrous ammonia',
          rate: 120,
          unit: 'lb N/ac',
          date: '2026-10-12',
          method: 'Fall knife-in',
        },
      ]),
    },
  },
  {
    id: 'field-2',
    name: 'Skunk River Bottom 120',
    lat: 42.0183,
    lng: -93.4412,
    acres: 120,
    soil: {
      mapUnitComponent: 'Coland clay loam',
      organicMatterPct: ssurgo(4.4, '%'),
      topsoilDepthIn: ssurgo(14, 'in'),
      slopePct: ssurgo(2, '%'),
      erosionClass: ssurgo('Slight'),
      drainageClass: ssurgo('Moderately well drained'),
      hydrologicGroup: ssurgo('C'),
      ph: ssurgo(7.1, 'pH'),
      cecMeq100g: ssurgo(28, 'meq/100g'),
      texture: ssurgo('clay loam'),
    },
    cropHistory: history([
      [2021, 'Corn'],
      [2022, 'Soybeans'],
      [2023, 'Corn'],
      [2024, 'Soybeans'],
      [2025, 'Corn'],
    ]),
    yieldHistory: yields([
      [2021, 198],
      [2022, 61],
      [2023, 205],
      [2024, 64],
      [2025, 208],
    ]),
    management: {
      tillage: farmer({ type: 'reduced', depthIn: 4 }),
      yieldGoalBuAc: farmer(210, 'bu/ac'),
      amendments: farmer([
        {
          product: 'Liquid swine manure',
          rate: 4000,
          unit: 'gal/ac',
          date: '2026-10-15',
          method: 'Injected',
        },
      ]),
    },
  },
  {
    id: 'field-3',
    name: 'Prairie Creek 160',
    lat: 42.0701,
    lng: -93.4075,
    acres: 160,
    soil: {
      mapUnitComponent: 'Nicollet loam',
      organicMatterPct: ssurgo(3.0, '%'),
      topsoilDepthIn: ssurgo(9, 'in'),
      slopePct: ssurgo(5, '%'),
      erosionClass: ssurgo('Moderate'),
      drainageClass: ssurgo('Well drained'),
      hydrologicGroup: ssurgo('B'),
      ph: {
        value: 5.8,
        tier: 'lab',
        unit: 'pH',
        method: '1:1 soil:water',
        sampleDate: '2021-04-10',
      },
      cecMeq100g: ssurgo(22, 'meq/100g'),
      texture: ssurgo('loam'),
    },
    cropHistory: history([
      [2021, 'Corn'],
      [2022, 'Corn'],
      [2023, 'Soybeans'],
      [2024, 'Corn'],
      [2025, 'Corn'],
    ]),
    yieldHistory: yields([
      [2021, 180],
      [2022, 171],
      [2023, 58],
      [2024, 183],
      [2025, 176],
    ]),
    management: {
      tillage: farmer({ type: 'none', depthIn: null }),
    },
  },
  {
    id: 'field-4',
    name: 'South Ridge 95',
    lat: 41.9954,
    lng: -93.5102,
    acres: 95,
    soil: {
      mapUnitComponent: 'Storden loam, severely eroded',
      organicMatterPct: ssurgo(1.8, '%'),
      topsoilDepthIn: ssurgo(5, 'in'),
      slopePct: ssurgo(9, '%'),
      erosionClass: ssurgo('Severe'),
      drainageClass: ssurgo('Somewhat excessively drained'),
      hydrologicGroup: ssurgo('B'),
      ph: ssurgo(7.6, 'pH'),
      cecMeq100g: ssurgo(14, 'meq/100g'),
      texture: ssurgo('loam'),
    },
    cropHistory: history([
      [2021, 'Corn'],
      [2022, 'Corn'],
      [2023, 'Corn'],
      [2024, 'Corn'],
      [2025, 'Corn'],
    ]),
    yieldHistory: yields([
      [2021, 165],
      [2022, 153],
      [2023, 144],
      [2024, 132],
      [2025, 121],
    ]),
    management: {
      tillage: farmer({ type: 'conventional', depthIn: 8 }),
      yieldGoalBuAc: farmer(170, 'bu/ac'),
      amendments: farmer([]),
    },
  },
  {
    id: 'field-5',
    name: 'East Timber Edge 140',
    lat: 42.0452,
    lng: -93.3822,
    acres: 140,
    soil: {
      mapUnitComponent: 'Hayden loam',
      organicMatterPct: ssurgo(5.1, '%'),
      topsoilDepthIn: ssurgo(16, 'in'),
      slopePct: ssurgo(1.5, '%'),
      erosionClass: ssurgo('Slight'),
      drainageClass: ssurgo('Well drained'),
      hydrologicGroup: ssurgo('B'),
      ph: ssurgo(6.6, 'pH'),
      cecMeq100g: ssurgo(24, 'meq/100g'),
      texture: ssurgo('silt loam'),
    },
    cropHistory: history([
      [2021, 'Soybeans'],
      [2022, 'Corn'],
      [2023, 'Cover crop'],
      [2024, 'Soybeans'],
      [2025, 'Corn'],
    ]),
    yieldHistory: yields([
      [2021, 66],
      [2022, 212],
      [2023, 0],
      [2024, 69],
      [2025, 218],
    ]),
    management: {
      tillage: farmer({ type: 'none', depthIn: null }),
      yieldGoalBuAc: farmer(220, 'bu/ac'),
      amendments: farmer([
        {
          product: 'UAN 32%',
          rate: 60,
          unit: 'lb N/ac',
          date: '2026-10-08',
          method: 'Fall surface band',
        },
      ]),
    },
  },
];

export function fetchStoryCountyFields(): FieldRecord[] {
  return STORY_COUNTY_FIELDS;
}

export function fetchFieldById(id: string): FieldRecord | undefined {
  return STORY_COUNTY_FIELDS.find((f) => f.id === id);
}

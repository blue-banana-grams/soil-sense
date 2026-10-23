import type { FieldRecord } from '../types.js';

// Mock data for Story County, IA, standing in for the real join of
// USDA SSURGO (soil) + CropScape/CDL (crop history) + NASS Quick Stats (yields)
// for this county. Swap fetchStoryCountyFields() for real API calls once
// the data pipeline is ready — the shape of FieldRecord stays the same.
export const STORY_COUNTY_FIELDS: FieldRecord[] = [
  {
    id: 'field-1',
    name: 'North Homestead 80',
    lat: 42.0558,
    lng: -93.4891,
    acres: 80,
    soil: {
      organicMatterPct: 2.1,
      topsoilDepthIn: 6,
      slopePct: 7.5,
      erosionClass: 'Severe',
      drainageClass: 'Well drained',
    },
    cropHistory: [
      { year: 2021, crop: 'Corn' },
      { year: 2022, crop: 'Corn' },
      { year: 2023, crop: 'Corn' },
      { year: 2024, crop: 'Corn' },
      { year: 2025, crop: 'Corn' },
    ],
    yieldHistory: [
      { year: 2021, bushelsPerAcre: 182 },
      { year: 2022, bushelsPerAcre: 174 },
      { year: 2023, bushelsPerAcre: 168 },
      { year: 2024, bushelsPerAcre: 159 },
      { year: 2025, bushelsPerAcre: 151 },
    ],
  },
  {
    id: 'field-2',
    name: 'Skunk River Bottom 120',
    lat: 42.0183,
    lng: -93.4412,
    acres: 120,
    soil: {
      organicMatterPct: 4.4,
      topsoilDepthIn: 14,
      slopePct: 2,
      erosionClass: 'Slight',
      drainageClass: 'Moderately well drained',
    },
    cropHistory: [
      { year: 2021, crop: 'Corn' },
      { year: 2022, crop: 'Soybeans' },
      { year: 2023, crop: 'Corn' },
      { year: 2024, crop: 'Soybeans' },
      { year: 2025, crop: 'Corn' },
    ],
    yieldHistory: [
      { year: 2021, bushelsPerAcre: 198 },
      { year: 2022, bushelsPerAcre: 61 },
      { year: 2023, bushelsPerAcre: 205 },
      { year: 2024, bushelsPerAcre: 64 },
      { year: 2025, bushelsPerAcre: 208 },
    ],
  },
  {
    id: 'field-3',
    name: 'Prairie Creek 160',
    lat: 42.0701,
    lng: -93.4075,
    acres: 160,
    soil: {
      organicMatterPct: 3.0,
      topsoilDepthIn: 9,
      slopePct: 5,
      erosionClass: 'Moderate',
      drainageClass: 'Well drained',
    },
    cropHistory: [
      { year: 2021, crop: 'Corn' },
      { year: 2022, crop: 'Corn' },
      { year: 2023, crop: 'Soybeans' },
      { year: 2024, crop: 'Corn' },
      { year: 2025, crop: 'Corn' },
    ],
    yieldHistory: [
      { year: 2021, bushelsPerAcre: 180 },
      { year: 2022, bushelsPerAcre: 171 },
      { year: 2023, bushelsPerAcre: 58 },
      { year: 2024, bushelsPerAcre: 183 },
      { year: 2025, bushelsPerAcre: 176 },
    ],
  },
  {
    id: 'field-4',
    name: 'South Ridge 95',
    lat: 41.9954,
    lng: -93.5102,
    acres: 95,
    soil: {
      organicMatterPct: 1.8,
      topsoilDepthIn: 5,
      slopePct: 9,
      erosionClass: 'Severe',
      drainageClass: 'Somewhat excessively drained',
    },
    cropHistory: [
      { year: 2021, crop: 'Corn' },
      { year: 2022, crop: 'Corn' },
      { year: 2023, crop: 'Corn' },
      { year: 2024, crop: 'Corn' },
      { year: 2025, crop: 'Corn' },
    ],
    yieldHistory: [
      { year: 2021, bushelsPerAcre: 165 },
      { year: 2022, bushelsPerAcre: 153 },
      { year: 2023, bushelsPerAcre: 144 },
      { year: 2024, bushelsPerAcre: 132 },
      { year: 2025, bushelsPerAcre: 121 },
    ],
  },
  {
    id: 'field-5',
    name: 'East Timber Edge 140',
    lat: 42.0452,
    lng: -93.3822,
    acres: 140,
    soil: {
      organicMatterPct: 5.1,
      topsoilDepthIn: 16,
      slopePct: 1.5,
      erosionClass: 'Slight',
      drainageClass: 'Well drained',
    },
    cropHistory: [
      { year: 2021, crop: 'Soybeans' },
      { year: 2022, crop: 'Corn' },
      { year: 2023, crop: 'Cover crop' },
      { year: 2024, crop: 'Soybeans' },
      { year: 2025, crop: 'Corn' },
    ],
    yieldHistory: [
      { year: 2021, bushelsPerAcre: 66 },
      { year: 2022, bushelsPerAcre: 212 },
      { year: 2023, bushelsPerAcre: 0 },
      { year: 2024, bushelsPerAcre: 69 },
      { year: 2025, bushelsPerAcre: 218 },
    ],
  },
];

export function fetchStoryCountyFields(): FieldRecord[] {
  return STORY_COUNTY_FIELDS;
}

export function fetchFieldById(id: string): FieldRecord | undefined {
  return STORY_COUNTY_FIELDS.find((f) => f.id === id);
}

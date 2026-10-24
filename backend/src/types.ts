export type Tier = 'lab' | 'field_test' | 'auto' | 'field_kit' | 'observation' | 'farmer_entry';

export interface Measured<T> {
  value: T;
  tier: Tier;
  unit?: string;
  method?: string;
  sampleDate?: string;
}

export type Texture =
  | 'sand'
  | 'loamy sand'
  | 'sandy loam'
  | 'loam'
  | 'silt loam'
  | 'clay loam'
  | 'silty clay loam'
  | 'clay'
  | 'other';

export interface CropHistoryEntry {
  year: number;
  crop: string;
}

export interface YieldEntry {
  year: number;
  bushelsPerAcre: number;
}

export interface SoilProfile {
  mapUnitComponent: string;
  componentName: string;
  organicMatterPct: Measured<number>;
  topsoilDepthIn: Measured<number>;
  slopePct: Measured<number>;
  erosionClass: Measured<string>;
  drainageClass: Measured<string>;
  // Can be a dual group like "B/D" (drained/undrained).
  hydrologicGroup: Measured<string>;
  ph?: Measured<number>;
  cecMeq100g?: Measured<number>;
  texture: Measured<Texture>;
  // Lab-only values, present only when the farmer enters a soil test.
  bufferPh?: Measured<number>;
  phosphorusPpm?: Measured<number>;
  potassiumPpm?: Measured<number>;
  nitrateNPpm?: Measured<number>;
}

export type TillageType = 'none' | 'reduced' | 'conventional';

export interface Tillage {
  type: TillageType;
  depthIn: number | null;
}

export interface Amendment {
  product: string;
  rate: number;
  unit: string;
  date: string;
  method: string;
}

export type PondingFrequency = 'never' | 'sometimes' | 'often';

// Optional so incomplete input still returns whatever can be computed.
export interface Management {
  tillage?: Measured<Tillage>;
  yieldGoalBuAc?: Measured<number>;
  // An empty list means the farmer explicitly recorded "none applied".
  amendments?: Measured<Amendment[]>;
  pondingOrSlowDrying?: Measured<PondingFrequency>;
}

export interface FieldRecord {
  name: string;
  lat: number;
  lng: number;
  soil: SoilProfile;
  cropHistory: Measured<CropHistoryEntry[]>;
  yieldHistory: Measured<YieldEntry[]>;
  management: Management;
}

export type PTestMethod = 'Bray-P1' | 'Mehlich-3' | 'Olsen';

export interface LabTest {
  sampleDate: string;
  ph?: number;
  bufferPh?: number;
  organicMatterPct?: number;
  phosphorusPpm?: number;
  potassiumPpm?: number;
  pTestMethod?: PTestMethod;
  nitrateNPpm?: number;
}

// Everything the farmer can optionally add after seeing their first results.
export interface FarmerDetails {
  tillage?: Tillage;
  yieldGoalBuAc?: number;
  amendments?: Amendment[];
  yieldHistory?: YieldEntry[];
  labTest?: LabTest;
  pondingOrSlowDrying?: PondingFrequency;
}

export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

export interface Confidence {
  value: number;
  level: ConfidenceLevel;
}

export interface ConfidenceFactor {
  label: string;
  detail: string;
  // Signed change in percentage points; 0 for purely informational factors.
  effect: number;
}

export interface OverallConfidence extends Confidence {
  dataValue: number;
  factors: ConfidenceFactor[];
}

export interface TopsoilScore {
  value: number;
  label: 'Healthy' | 'Watch' | 'At risk' | 'Depleted';
  reasons: string[];
  confidence: Confidence;
}

export type RecommendationId =
  | 'lime_rate'
  | 'phosphorus_potassium_rate'
  | 'nitrogen_plan'
  | 'compaction'
  | 'structure_organic_matter'
  | 'ph_direction';

export interface Recommendation {
  id: RecommendationId;
  title: string;
  status: 'ready' | 'needs_data';
  advice: string;
  confidence: Confidence | null;
  missing: string[];
  improvesWith: string[];
}

export interface RotationYearPlan {
  year: number;
  crop: string;
  why: string;
}

export interface RotationPlan {
  summary: string;
  years: RotationYearPlan[];
}

export interface GrowthStage {
  stage: string;
  gddThreshold: number;
  // null when the stage isn't typically reached before the first fall frost.
  estDate: string | null;
}

export interface SeasonCalendar {
  year: number;
  plantingWindow: { start: string; end: string };
  growthStages: GrowthStage[];
  fertilizerTiming: string;
  harvestWindow: { start: string; end: string };
  coverCropWindow: { start: string; end: string };
  notes: string[];
}

export interface ClimateSummary {
  years: number;
  lastSpringFrost: { typical: string; late: string } | null;
  firstFallFrost: { early: string; typical: string } | null;
  frostFreeDays: { p10: number; p50: number; p90: number };
  seasonalGddF: { p10: number; p50: number; p90: number };
  growingSeasonRainIn: number;
  rainVariabilityPct: number;
}

export interface CurrentConditions {
  date: string;
  soilTempF: number | null;
  next7: { rainIn: number; lowF: number; highF: number };
}

export interface ThisWeek {
  headline: string;
  items: string[];
  conditions: CurrentConditions;
}

export interface LocationInfo {
  lat: number;
  lng: number;
  label: string;
  countyName: string;
  countyBaseName: string;
  stateAlpha: string;
  stateName: string;
}

export interface GeocodeResult {
  label: string;
  detail: string;
  lat: number;
  lng: number;
}

export interface CountyStats {
  yields: Record<'Corn' | 'Soybeans', Record<number, number>>;
  irrigatedCornSharePct: number | null;
  // NASS hides ("(D)") figures that would reveal individual farms, usually because few farms irrigate.
  irrigationWithheld: boolean;
}

export interface YieldComparison {
  year: number;
  crop: 'Corn' | 'Soybeans';
  fieldBuAc: number;
  countyBuAc: number;
}

export interface CountyBenchmark {
  county: string;
  source: string;
  summary: string;
  years: YieldComparison[];
}

export interface DataSourceStatus {
  name: string;
  ok: boolean;
}

export interface Report {
  location: LocationInfo;
  place: string;
  farmlandWarning: string | null;
  soil: SoilProfile;
  cropHistory: Measured<CropHistoryEntry[]>;
  yieldHistory: Measured<YieldEntry[]>;
  management: Management;
  score: TopsoilScore;
  confidence: OverallConfidence;
  // Kept separate from confidence, per the spec: how much advice the farmer's data unlocks.
  completeness: { ready: number; total: number };
  rotation: RotationPlan;
  calendar: SeasonCalendar | null;
  thisWeek: ThisWeek | null;
  climate: ClimateSummary | null;
  recommendations: Recommendation[];
  countyBenchmark: CountyBenchmark | null;
  countyCornYieldAvg: number | null;
  aiExplanation: string;
  sources: DataSourceStatus[];
}

// farmer_entry is not a tier in the spec; see TIER_BASE in services/confidence.ts.
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

export type HydrologicGroup = 'A' | 'B' | 'C' | 'D';

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
  organicMatterPct: Measured<number>;
  topsoilDepthIn: Measured<number>;
  slopePct: Measured<number>;
  erosionClass: Measured<string>;
  drainageClass: Measured<string>;
  hydrologicGroup: Measured<HydrologicGroup>;
  ph: Measured<number>;
  cecMeq100g: Measured<number>;
  texture: Measured<Texture>;
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

// Optional so incomplete input still returns whatever can be computed.
export interface Management {
  tillage?: Measured<Tillage>;
  yieldGoalBuAc?: Measured<number>;
  amendments?: Measured<Amendment[]>;
}

export interface FieldRecord {
  id: string;
  name: string;
  lat: number;
  lng: number;
  acres: number;
  soil: SoilProfile;
  cropHistory: Measured<CropHistoryEntry[]>;
  yieldHistory: Measured<YieldEntry[]>;
  management: Management;
}

export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

export interface Confidence {
  value: number;
  level: ConfidenceLevel;
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
  estDate: string;
}

export interface SeasonCalendar {
  plantingWindow: { start: string; end: string };
  growthStages: GrowthStage[];
  fertilizerTiming: string;
  harvestWindow: { start: string; end: string };
  coverCropWindow: { start: string; end: string };
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

export interface FieldDetail extends FieldRecord {
  score: TopsoilScore;
  rotation: RotationPlan;
  calendar: SeasonCalendar;
  recommendations: Recommendation[];
  countyBenchmark: CountyBenchmark | null;
  aiExplanation: string;
}

export interface FieldSummary {
  id: string;
  name: string;
  lat: number;
  lng: number;
  acres: number;
  scoreValue: number;
}

export interface FieldSummary {
  id: string;
  name: string;
  lat: number;
  lng: number;
  acres: number;
  scoreValue: number;
}

export interface CropHistoryEntry {
  year: number;
  crop: string;
}

export interface YieldEntry {
  year: number;
  bushelsPerAcre: number;
}

export interface SoilProfile {
  organicMatterPct: number;
  topsoilDepthIn: number;
  slopePct: number;
  erosionClass: string;
  drainageClass: string;
}

export interface TopsoilScore {
  value: number; // 0-100
  label: 'Healthy' | 'Watch' | 'At risk' | 'Depleted';
  reasons: string[];
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

export interface FieldDetail {
  id: string;
  name: string;
  lat: number;
  lng: number;
  acres: number;
  soil: SoilProfile;
  cropHistory: CropHistoryEntry[];
  yieldHistory: YieldEntry[];
  score: TopsoilScore;
  rotation: RotationPlan;
  calendar: SeasonCalendar;
  aiExplanation: string;
}

// Evidence for the "How to fix it" section. Every claim and link below was
// checked against the primary source on 2026-10-24 (abstract, publication page
// or official standard).
import type { Evidence, Practice, ProblemKey } from '../types.js';

const NRCS_COVER_CROP: Evidence = {
  claim: 'USDA lists reducing erosion and building soil organic matter among the purposes of cover crops.',
  source: 'USDA NRCS Conservation Practice Standard 340, Cover Crop',
  url: 'https://www.nrcs.usda.gov/resources/guides-and-instructions/cover-crop-ac-340-conservation-practice-standard',
};

const SARE_ORGANIC_MATTER: Evidence = {
  claim: 'Organic matter is built over years by adding residues, cover crops and manure, and by cutting losses from tillage and erosion.',
  source: 'SARE, Building Soils for Better Crops (4th ed.), Ch. 9',
  url: 'https://www.sare.org/publications/building-soils-for-better-crops/ch-9-managing-for-high-quality-soils-and-focusing-on-organic-matter-management',
};

const MONTGOMERY_NO_TILL: Evidence = {
  claim: 'Plowed fields erode 10 to 100 times faster than soil forms; no-till erosion rates are much closer to the rate soil forms.',
  source: 'Montgomery, Soil erosion and agricultural sustainability, PNAS (2007)',
  url: 'https://doi.org/10.1073/pnas.0611508104',
};

const SCHULTE_PRAIRIE_STRIPS: Evidence = {
  claim: 'Replacing 10% of cropland with prairie strips cut runoff 37% and kept 20 times more soil on the field; yields fell only by the area taken out.',
  source: 'Schulte et al., PNAS 114:11247–11252 (2017)',
  url: 'https://doi.org/10.1073/pnas.1620229114',
};

const NRCS_CONTOUR: Evidence = {
  claim: 'Farming across the slope on the contour is a USDA practice to reduce sheet and rill erosion on sloping cropland.',
  source: 'USDA NRCS Conservation Practice Standard 330, Contour Farming',
  url: 'https://www.nrcs.usda.gov/resources/guides-and-instructions/contour-farming-ac-330-conservation-practice-standard',
};

const SEIFERT_ROTATION: Evidence = {
  claim: 'Across 748,374 Midwest field records, continuous corn yielded 4.3% less on rainfed fields, a penalty that leveled off after 3 years in corn.',
  source: 'Seifert, Roberts & Lobell, Agronomy Journal 109:541–548 (2017)',
  url: 'https://doi.org/10.2134/agronj2016.03.0134',
};

const NRCS_ROTATION: Evidence = {
  claim: 'USDA lists reducing erosion, maintaining organic matter and lowering pest pressure among the purposes of crop rotation.',
  source: 'USDA NRCS Conservation Practice Standard 328, Conservation Crop Rotation',
  url: 'https://www.nrcs.usda.gov/resources/guides-and-instructions/conservation-crop-rotation-ac-328-conservation-practice-standard',
};

const ISU_LIME: Evidence = {
  claim: 'Iowa State considers pH 6.0 (west/north-central Iowa) or 6.5 (rest of Iowa) sufficient for corn and soybean; the lime rate comes from the buffer pH test, and liming at pH 5.8 or higher may not pay right away.',
  source: 'Iowa State Extension (Schmitt, 2024), citing PM 1688',
  url: 'https://crops.extension.iastate.edu/post/lime-phosphorus-and-potassium-fertilizers-decisions-times-limited-resources',
};

const ISU_HIGH_PH: Evidence = {
  claim: 'Iron deficiency chlorosis hits soybeans on calcareous soils above pH 7.3–7.4; an IDC-tolerant variety is the most cost-effective fix, and no in-season treatment eliminates it.',
  source: 'Iowa State Extension (Anderson & Mallarino, 2021)',
  url: 'https://crops.extension.iastate.edu/post/whats-all-yellow-soybean',
};

const UMN_COMPACTION: Evidence = {
  claim: 'Wet soils compact easily; staying off wet soil, keeping axle loads under 10 tons and controlled traffic limit compaction. Subsoiling has not been shown to raise yields consistently.',
  source: 'University of Minnesota Extension (DeJong-Hughes), Soil compaction',
  url: 'https://extension.umn.edu/soil-management-and-health/soil-compaction',
};

// Keyed by the kind of problem scoring.ts reports.
export const FIXES: Record<ProblemKey, Practice[]> = {
  lowOrganicMatter: [
    { title: 'Plant cover crops', what: 'Keep roots growing between cash crops.', evidence: [NRCS_COVER_CROP, SARE_ORGANIC_MATTER] },
    { title: 'Cut tillage', what: 'Less tillage means less organic matter burned off.', evidence: [SARE_ORGANIC_MATTER] },
  ],
  thinTopsoilOrErosion: [
    { title: 'Switch to no-till', what: 'Leave residue on the surface to hold soil.', evidence: [MONTGOMERY_NO_TILL] },
    { title: 'Add prairie strips on slopes', what: 'Native prairie in about 10% of the field, placed to catch runoff.', evidence: [SCHULTE_PRAIRIE_STRIPS] },
    { title: 'Farm on the contour', what: 'Plant and till across the slope, not up and down it.', evidence: [NRCS_CONTOUR] },
  ],
  continuousCorn: [
    { title: 'Rotate with soybeans', what: 'Break the run of corn years.', evidence: [SEIFERT_ROTATION, NRCS_ROTATION] },
  ],
  conventionalTillage: [
    { title: 'Move to reduced or no-till', what: 'Fewer passes, more residue left on top.', evidence: [MONTGOMERY_NO_TILL] },
  ],
  acidicPh: [
    { title: 'Lime based on a buffer pH test', what: 'Apply the lime rate your lab report gives.', evidence: [ISU_LIME] },
  ],
  alkalinePh: [
    { title: 'Plant IDC-tolerant soybeans', what: 'High pH is hard to lower; pick varieties that cope with it.', evidence: [ISU_HIGH_PH] },
  ],
  ponding: [
    { title: 'Stay off wet ground', what: 'Limit traffic and axle loads when soil is wet; keep to the same wheel tracks.', evidence: [UMN_COMPACTION] },
  ],
};

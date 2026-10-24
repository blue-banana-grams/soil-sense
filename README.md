# SoilSense

A free, open-source web app that helps corn farmers see how healthy the
topsoil on their field is and plan rotations and seasons to protect it.
Built for the Soil Health / AI Helper hackathon challenge. Works anywhere in
the lower 48 US states.

Live: https://soil-sense-xi.vercel.app (phone preview: `/?view=phone`)

## How it works

1. **Location first.** The landing page asks one thing: where's your field?
   Town or ZIP search, "Use my location", or "Try an example".
2. **Results from public data.** The backend looks up that exact point and
   returns a topsoil score, a confidence level with a plain "why" list, a
   "This week on your field" card, a rotation plan and a season calendar.
3. **Optional details.** "Tell us about your field" asks a few skippable
   questions (tillage, ponding, last season's yield, fertilizer, lab soil
   test). Answers unlock more advice ("advice unlocked: 3 of 5"); a lab test
   also raises confidence. They are kept in the browser's local storage per
   location.

## What's here

- `frontend/` — React + Vite + TypeScript + Tailwind + Leaflet.
- `backend/` — Node + Express + TypeScript API:
  - `GET /api/geocode?q=` — town / ZIP search (lower 48 only)
  - `POST /api/report` — `{ lat, lng, place?, details? }` → full report
- `vercel.json` — deploys both as one Vercel project (`/api` → backend).

## Running it locally

Needs Node 20+.

```bash
cd backend && npm install && npm run dev
```

```bash
cd frontend && npm install && npm run dev
```

Frontend runs on http://localhost:5173 and proxies `/api` to the backend
on http://localhost:4000.

For county yields and irrigation, copy `backend/.env.example` to
`backend/.env` and add a free USDA NASS Quick Stats key
(https://quickstats.nass.usda.gov/api). Without it, the app still works and
leaves those parts out. `.env` is git-ignored; never commit the key.

## Data sources (all free)

| Data | Source | File |
|---|---|---|
| County for a point; lower-48 check | US Census geocoder | `services/geo.ts` |
| Town / ZIP search | Open-Meteo geocoding | `services/geo.ts` |
| Soil: organic matter, pH, CEC, texture, slope, drainage, erosion, topsoil depth | USDA Soil Data Access (SSURGO) | `services/ssurgo.ts` |
| Crop grown each of the last 5 years | USDA CropScape (Cropland Data Layer) | `services/cropscape.ts` |
| 30-year frost dates, heat units (GDD), rain variability; soil temp + 7-day forecast | Open-Meteo archive + forecast | `services/weather.ts` |
| County yields; share of corn irrigated (2022 Census of Agriculture) | USDA NASS Quick Stats | `services/nass.ts` |

Only the soil survey is required. If any other source fails, the report
still loads, lowers confidence where it matters, and lists what was
unavailable. Lookups are cached in memory (`services/cache.ts`).

## Score, confidence & plan logic

Inputs follow `corn_soil_algorithm_input_spec_corrected.xlsx` (draft v0.1,
corrected). Every value is stored with its source tier (lab 1.0, field test
0.7, USDA map data 0.6, field kit 0.5, farmer entry 0.5, observation 0.35),
unit, method and sample date. All weights and cutoffs are placeholders
pending agronomist calibration.

- `services/confidence.ts` — the spec's confidence rules (tier base
  confidence, age and missing-method penalties, High/Medium/Low), plus a
  location adjustment in percentage points. The headline number covers the
  soil and crop data behind the results; completeness (how much advice the
  farmer's answers unlock) is reported separately, as the spec asks.
- **Nitrogen:** per the corrected spec, no rate is calculated without a
  validated regional method and its mandatory inputs. None is wired in yet
  (`NITROGEN_METHOD_AVAILABLE` in `services/recommendations.ts`), so the app
  gives general guidance only.
- `services/locationConfidence.ts` — location factors: whether satellite
  records show cropland, year-to-year rain variability, irrigated share of
  county corn, and frost-free season length vs corn's ~130 days.
- `services/recommendations.ts` — the spec's recommendation gates. Never
  calculates lime or P/K rates; lists what's missing and what would raise
  confidence.
- `services/scoring.ts` — rule-based topsoil health score (0–100).
- `services/rotation.ts` — multi-year rotation plan starting next season.
- `services/calendar.ts` / `services/season.ts` — season calendar from the
  location's own climate (spec Climate_Derivations: 86/50 °F GDD, May–Sep,
  frost at ≤ 0 °C), and the "This week" card from today's date and forecast.
- `services/ai.ts` — plain-language explanation; a template for now, meant
  to be replaced with a real LLM call.

# SoilSense

A free, open-source web app that helps corn farmers see how much healthy
topsoil is left on their fields and plan rotations and seasons to protect
it. Built for the Soil Health / AI Helper hackathon challenge, scoped to
Story County, Iowa for the demo.

## What's here

- `frontend/` — React + Vite + TypeScript + Tailwind, Leaflet map of Story
  County fields, a slide-out panel with the topsoil score, rotation plan,
  season calendar, and plain-language AI explanation.
- `backend/` — Node + Express + TypeScript API. Currently serves mock
  Story County field data (`backend/src/config/storyCounty.ts`) run through
  the real scoring/rotation/calendar logic — swap the mock data source for
  live USDA/Open-Meteo calls without touching the routes or frontend.

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

## Data sources (to wire in, all free)

- USDA SSURGO / Soil Data Access — organic matter, topsoil depth, slope, drainage, erosion
- USDA CropScape (Cropland Data Layer) — crop grown per field per year
- USDA NASS Quick Stats — county yields over time (free API key)
- Open-Meteo — historical + forecast weather for GDD and soil temperature

Each has a clear seam in `backend/src/services/` and
`backend/src/config/storyCounty.ts` to swap mock data for a live fetch.

## Score & rotation logic

- `backend/src/services/scoring.ts` — rule-based topsoil health score (0–100)
  from organic matter, topsoil depth, slope, erosion class, and years of
  continuous corn.
- `backend/src/services/rotation.ts` — rule-based multi-year rotation plan;
  breaks continuous corn into corn-soybean rotation, adds a cover crop year
  when organic matter is low or slope is steep.
- `backend/src/services/calendar.ts` — season calendar (planting window,
  growth stages, fertilizer timing, harvest, cover crop window); currently
  static placeholder dates, meant to be replaced with a real GDD calc
  against Open-Meteo data.
- `backend/src/services/ai.ts` — plain-language explanation; currently a
  template, meant to be replaced with a real LLM call.

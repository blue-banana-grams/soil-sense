import { Router } from 'express';
import { LocationError, searchPlaces } from '../services/geo.js';
import { buildReport } from '../services/report.js';
import { SoilDataMissingError } from '../services/ssurgo.js';
import { ValidationError, parseReportRequest } from '../services/validate.js';

export const reportRouter = Router();

reportRouter.get('/geocode', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (q.length < 2 || q.length > 80) {
    res.status(400).json({ error: 'Type at least 2 characters.' });
    return;
  }
  try {
    res.json(await searchPlaces(q));
  } catch (err) {
    console.error('Geocoding failed:', (err as Error).message);
    res.status(502).json({ error: "Place search isn't responding. Try again, or use your location." });
  }
});

reportRouter.post('/report', async (req, res) => {
  try {
    const { lat, lng, place, details } = parseReportRequest(req.body);
    res.json(await buildReport(lat, lng, place, details));
  } catch (err) {
    if (err instanceof ValidationError || err instanceof LocationError) {
      res.status(400).json({ error: err.message });
    } else if (err instanceof SoilDataMissingError) {
      res.status(404).json({ error: err.message });
    } else {
      console.error('Report failed:', (err as Error).message);
      res.status(502).json({
        error: "A USDA data service isn't responding right now. Try again in a minute.",
      });
    }
  }
});

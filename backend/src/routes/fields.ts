import { Router } from 'express';
import { fetchFieldById, fetchStoryCountyFields } from '../config/storyCounty.js';
import { scoreField } from '../services/scoring.js';
import { planRotation } from '../services/rotation.js';
import { buildSeasonCalendar } from '../services/calendar.js';
import { explainField } from '../services/ai.js';
import type { FieldDetail, FieldSummary } from '../types.js';

export const fieldsRouter = Router();

fieldsRouter.get('/', (_req, res) => {
  const summaries: FieldSummary[] = fetchStoryCountyFields().map((field) => ({
    id: field.id,
    name: field.name,
    lat: field.lat,
    lng: field.lng,
    acres: field.acres,
    scoreValue: scoreField(field).value,
  }));
  res.json(summaries);
});

fieldsRouter.get('/:id', (req, res) => {
  const field = fetchFieldById(req.params.id);
  if (!field) {
    res.status(404).json({ error: 'Field not found' });
    return;
  }

  const score = scoreField(field);
  const rotation = planRotation(field);
  const calendar = buildSeasonCalendar(new Date().getFullYear() + 1);
  const aiExplanation = explainField(field, score, rotation);

  const detail: FieldDetail = {
    ...field,
    score,
    rotation,
    calendar,
    aiExplanation,
  };

  res.json(detail);
});

import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { reportRouter } from './routes/report.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', reportRouter);

export default app;

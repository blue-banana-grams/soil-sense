import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { fieldsRouter } from './routes/fields.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/fields', fieldsRouter);

export default app;

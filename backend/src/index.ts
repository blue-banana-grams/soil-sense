import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { fieldsRouter } from './routes/fields.js';

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/fields', fieldsRouter);

app.listen(port, () => {
  console.log(`SoilSense API listening on http://localhost:${port}`);
});

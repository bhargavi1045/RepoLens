import express, { Application } from 'express';
import cors from 'cors';
import router from '../src/api/routes/index';
import { errorHandler } from '../src/api/middleware/errorHandler';

const app: Application = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', router);
app.use(errorHandler);

export default app;

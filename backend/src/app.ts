import express, { Application } from 'express';
import cors from 'cors';
import router from '../src/api/routes/index';
import { errorHandler } from '../src/api/middleware/errorHandler';
import dotenv from 'dotenv';

dotenv.config();

const app: Application = express();

app.use(cors({
  origin: function (origin, callback) {
    const allowed = [
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    if (!origin) return callback(null, true); 
    if (allowed.includes(origin!)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true, 
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', router);
app.use(errorHandler);

export default app;

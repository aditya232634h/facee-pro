import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import routes from './routes/index.js';
import { config } from './config/env.js';
import { notFound, errorHandler } from './middleware/index.js';

const app = express();
app.set('trust proxy', 1); // behind Render/Vercel proxies
app.use(helmet());
app.use(cors({ origin: config.clientOrigin.split(',').map((s) => s.trim()), credentials: true }));
app.use(express.json({ limit: '50kb' }));
app.use('/api', rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false, skip: () => config.env === 'test' }));

app.get('/api/health', (_req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({ success: connected, data: { status: connected ? 'ok' : 'degraded', database: connected ? 'connected' : 'disconnected', uptimeSeconds: Math.round(process.uptime()) } });
});
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

export default app;

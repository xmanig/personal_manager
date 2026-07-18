import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import authRoutes from './routes/auth';
import notesRoutes from './routes/notes';
import tagsRoutes from './routes/tags';
import foldersRoutes from './routes/folders';
import calendarRoutes from './routes/calendar';
import billsRoutes from './routes/bills';
import { errorHandler, notFound } from './middleware/error-handler';
import { logger } from './lib/logger';

const app = express();
const port = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:1420', credentials: true }));
app.use(express.json());

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many requests' } });
const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, message: { error: 'Too many requests' } });
const gmailLimiter = rateLimit({ windowMs: 60 * 1000, max: 5, message: { error: 'Too many requests' } });

app.use('/api/auth', authLimiter);
app.use('/api/notes/summarize', aiLimiter);
app.use('/api/notes/smart-search', aiLimiter);
app.use('/api/bills/parse', aiLimiter);
app.use('/api/bills/fetch-gmail', gmailLimiter);
app.use('/api/bills/fetch-gmail-all', gmailLimiter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

app.use('/api', authRoutes);
app.use('/api', notesRoutes);
app.use('/api', tagsRoutes);
app.use('/api', foldersRoutes);
app.use('/api', calendarRoutes);
app.use('/api/bills', billsRoutes);

const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));

app.use('/api', notFound);
app.use('/api', errorHandler);

app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});

export default app;

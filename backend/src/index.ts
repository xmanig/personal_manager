import 'dotenv/config';
import express from 'express';
import path from 'path';
import authRoutes from './routes/auth';
import notesRoutes from './routes/notes';
import tagsRoutes from './routes/tags';
import foldersRoutes from './routes/folders';
import calendarRoutes from './routes/calendar';
import billsRoutes from './routes/bills';

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

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
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;

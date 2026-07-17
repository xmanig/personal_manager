import 'dotenv/config';
import express from 'express';
import authRoutes from './routes/auth';

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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;

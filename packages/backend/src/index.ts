import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config';
import { authRouter } from './routes/auth';
import { plantsRouter } from './routes/plants';
import { roundsRouter } from './routes/rounds';
import { checklistRouter } from './routes/checklist';
import { labsRouter } from './routes/labs';
import { observationsRouter } from './routes/observations';
import { suggestionsRouter } from './routes/suggestions';
import { issuesRouter } from './routes/issues';
import { historyRouter } from './routes/history';
import { adminRouter } from './routes/admin';

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Setup + Reset endpoints
app.get('/api/setup', async (_req, res) => {
  try {
    const { autoSetup } = require('./setup');
    await autoSetup();
    res.json({ success: true, message: 'Setup complete' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/reset-db', async (_req, res) => {
  try {
    const { resetAndSeed } = require('./setup');
    await resetAndSeed();
    res.json({ success: true, message: 'Database reset and seeded with new roles (USER/ADMIN)' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/plants', plantsRouter);
app.use('/api/rounds', roundsRouter);
app.use('/api/rounds', checklistRouter);
app.use('/api/rounds', labsRouter);
app.use('/api/rounds', observationsRouter);
app.use('/api/rounds', suggestionsRouter);
app.use('/api/rounds', issuesRouter);
app.use('/api/history', historyRouter);
app.use('/api/admin', adminRouter);

// Serve admin panel in production
const adminPath = path.join(__dirname, '../../admin/dist');
app.use(express.static(adminPath));
app.get('*', (_req, res, next) => {
  if (_req.path.startsWith('/api')) return next();
  res.sendFile(path.join(adminPath, 'index.html'));
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

import { autoSetup } from './setup';

app.listen(config.port, async () => {
  console.log(`Oscar API running on port ${config.port}`);
  await autoSetup();
});

export default app;

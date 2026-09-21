import express from 'express';
import cors from 'cors';
import { initDatabase } from './db.js';
import createRemediesRouter from './routes/remedies.js';
import createSymptomsRouter from './routes/symptoms.js';
import createCasesRouter from './routes/cases.js';
import createStatsRouter from './routes/stats.js';

// Initialize database
const db = initDatabase();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging (development only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// API Routes
app.use('/api/remedies', createRemediesRouter(db));
app.use('/api/symptoms', createSymptomsRouter(db));
app.use('/api/cases', createCasesRouter(db));
app.use('/api/stats', createStatsRouter(db));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║     Materia Medica Builder - Server           ║
╠═══════════════════════════════════════════════╣
║  Running on: http://localhost:${PORT}            ║
║  Database: /data/materia-medica.db            ║
║  Status: ✓ Ready                              ║
╚═══════════════════════════════════════════════╝
  `);
});

export default app;

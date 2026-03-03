require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const rateLimit = require('express-rate-limit');

const { pool, connectRedis } = require('./db/client');
const authRoutes    = require('./routes/auth');
const userRoutes    = require('./routes/users');
const postRoutes    = require('./routes/posts');
const progressRoutes = require('./routes/progress');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logger');

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Global Middleware ─────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(requestLogger);

// Rate limit: 100 requests per 15 minutes per IP
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// ── Health Check ─────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', time: new Date().toISOString() });
  } catch (e) {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

// ── API Routes ────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/users',    userRoutes);
app.use('/api/posts',    postRoutes);
app.use('/api/progress', progressRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ── Global Error Handler ─────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────
async function start() {
  await connectRedis();
  app.listen(PORT, () => {
    console.log(`\n🚀  API running at http://localhost:${PORT}`);
    console.log(`📋  Health:  http://localhost:${PORT}/health`);
    console.log(`👥  Users:   http://localhost:${PORT}/api/users`);
    console.log(`📝  Posts:   http://localhost:${PORT}/api/posts\n`);
  });
}

start().catch(console.error);

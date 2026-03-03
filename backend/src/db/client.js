const { Pool } = require('pg');
const { createClient } = require('redis');

// ── PostgreSQL ────────────────────────────────────────────────────────
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err.message);
});

// ── Redis ─────────────────────────────────────────────────────────────
const redisClient = createClient({ url: process.env.REDIS_URL });

redisClient.on('error', (err) => console.error('Redis error:', err.message));
redisClient.on('connect', () => console.log('✅  Redis connected'));

async function connectRedis() {
  await redisClient.connect();
}

// ── Cache helpers ─────────────────────────────────────────────────────
async function getCache(key) {
  try {
    const val = await redisClient.get(key);
    return val ? JSON.parse(val) : null;
  } catch { return null; }
}

async function setCache(key, value, ttlSeconds = 60) {
  try {
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch { /* non-fatal */ }
}

async function delCache(key) {
  try { await redisClient.del(key); } catch { /* non-fatal */ }
}

module.exports = { pool, redisClient, connectRedis, getCache, setCache, delCache };

const express = require('express');
const { pool, getCache, setCache, delCache } = require('../db/client');
const { authenticate } = require('../middleware/logger');
const { ApiError } = require('../middleware/errorHandler');

const router = express.Router();

// ── GET /api/posts?page=1&limit=10 ───────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const offset = (page - 1) * limit;

    const cacheKey = `posts:page${page}:limit${limit}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json({ ...cached, source: 'cache' });

    const { rows } = await pool.query(`
      SELECT p.id, p.title, p.body, p.created_at,
             u.id as author_id, u.name as author_name
      FROM posts p
      JOIN users u ON u.id = p.user_id
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const { rows: countRows } = await pool.query('SELECT COUNT(*) FROM posts');
    const total = parseInt(countRows[0].count);

    const result = { data: rows, page, limit, total, pages: Math.ceil(total / limit) };
    await setCache(cacheKey, result, 20);
    res.json({ ...result, source: 'db' });
  } catch (err) { next(err); }
});

// ── GET /api/posts/:id ────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new ApiError(400, 'id must be a number');

    const cached = await getCache(`post:${id}`);
    if (cached) return res.json({ ...cached, source: 'cache' });

    const { rows } = await pool.query(`
      SELECT p.*, u.name as author_name, u.email as author_email
      FROM posts p JOIN users u ON u.id = p.user_id
      WHERE p.id = $1
    `, [id]);
    if (!rows[0]) throw new ApiError(404, `Post ${id} not found`);

    await setCache(`post:${id}`, rows[0], 60);
    res.json({ ...rows[0], source: 'db' });
  } catch (err) { next(err); }
});

// ── POST /api/posts ───────────────────────────────────────────────────
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { title, body } = req.body;
    if (!title || !body) throw new ApiError(400, 'title and body are required');
    if (title.length < 3) throw new ApiError(422, 'title must be at least 3 characters');

    const { rows } = await pool.query(
      'INSERT INTO posts (title, body, user_id) VALUES ($1,$2,$3) RETURNING *',
      [title, body, req.user.userId]
    );
    await delCache('posts:page1:limit10');  // bust page 1 cache
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// ── PATCH /api/posts/:id ──────────────────────────────────────────────
router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { rows: existing } = await pool.query('SELECT * FROM posts WHERE id=$1', [id]);
    if (!existing[0]) throw new ApiError(404, 'Post not found');
    if (existing[0].user_id !== req.user.userId && req.user.role !== 'admin') {
      throw new ApiError(403, 'Can only edit your own posts');
    }

    const { title, body } = req.body;
    const { rows } = await pool.query(
      'UPDATE posts SET title=COALESCE($1,title), body=COALESCE($2,body) WHERE id=$3 RETURNING *',
      [title || null, body || null, id]
    );

    await delCache(`post:${id}`);
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// ── DELETE /api/posts/:id ─────────────────────────────────────────────
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { rows } = await pool.query('SELECT user_id FROM posts WHERE id=$1', [id]);
    if (!rows[0]) throw new ApiError(404, 'Post not found');
    if (rows[0].user_id !== req.user.userId && req.user.role !== 'admin') {
      throw new ApiError(403, 'Can only delete your own posts');
    }

    await pool.query('DELETE FROM posts WHERE id=$1', [id]);
    await delCache(`post:${id}`);
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;

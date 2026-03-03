const express = require('express');
const { pool, getCache, setCache, delCache } = require('../db/client');
const { authenticate, requireRole } = require('../middleware/logger');
const { ApiError } = require('../middleware/errorHandler');

const router = express.Router();

// ── GET /api/users  (admin only, cached) ─────────────────────────────
router.get('/', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const cached = await getCache('users:all');
    if (cached) return res.json({ data: cached, total: cached.length, source: 'cache' });

    const { rows } = await pool.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY id'
    );
    await setCache('users:all', rows, 30);   // cache 30s
    res.json({ data: rows, total: rows.length, source: 'db' });
  } catch (err) { next(err); }
});

// ── GET /api/users/:id ────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new ApiError(400, 'id must be a number');

    // Only admin or the user themselves can view the profile
    if (req.user.role !== 'admin' && req.user.userId !== id) {
      throw new ApiError(403, 'Access denied');
    }

    const cached = await getCache(`user:${id}`);
    if (cached) return res.json({ ...cached, source: 'cache' });

    const { rows } = await pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1', [id]
    );
    if (!rows[0]) throw new ApiError(404, `User ${id} not found`);

    await setCache(`user:${id}`, rows[0], 60);
    res.json({ ...rows[0], source: 'db' });
  } catch (err) { next(err); }
});

// ── PATCH /api/users/:id  (update own profile) ───────────────────────
router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (req.user.userId !== id && req.user.role !== 'admin') {
      throw new ApiError(403, 'Can only update your own profile');
    }

    const { name } = req.body;
    if (!name) throw new ApiError(400, 'Only `name` can be updated');

    const { rows } = await pool.query(
      'UPDATE users SET name=$1, updated_at=NOW() WHERE id=$2 RETURNING id,name,email,role',
      [name, id]
    );
    if (!rows[0]) throw new ApiError(404, 'User not found');

    await delCache(`user:${id}`);
    await delCache('users:all');
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// ── DELETE /api/users/:id  (admin only) ──────────────────────────────
router.delete('/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { rowCount } = await pool.query('DELETE FROM users WHERE id=$1', [id]);
    if (rowCount === 0) throw new ApiError(404, 'User not found');

    await delCache(`user:${id}`);
    await delCache('users:all');
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;

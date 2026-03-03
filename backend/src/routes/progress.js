const express = require('express');
const { pool }     = require('../db/client');
const { authenticate } = require('../middleware/logger');
const { ApiError } = require('../middleware/errorHandler');

const router = express.Router();

// ── GET /api/progress  (my progress) ─────────────────────────────────
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM lesson_progress WHERE user_id=$1 ORDER BY lesson_id',
      [req.user.userId]
    );
    const passed = rows.filter(r => r.passed).length;
    res.json({ progress: rows, passed, total: 12 });
  } catch (err) { next(err); }
});

// ── POST /api/progress/:lessonId  (mark lesson passed) ───────────────
router.post('/:lessonId', authenticate, async (req, res, next) => {
  try {
    const lessonId = parseInt(req.params.lessonId);
    if (lessonId < 1 || lessonId > 12) throw new ApiError(400, 'lessonId must be 1–12');

    const { rows } = await pool.query(`
      INSERT INTO lesson_progress (user_id, lesson_id, passed, attempts, passed_at)
      VALUES ($1, $2, true, 1, NOW())
      ON CONFLICT (user_id, lesson_id)
      DO UPDATE SET passed=true, attempts=lesson_progress.attempts+1, passed_at=NOW()
      RETURNING *
    `, [req.user.userId, lessonId]);

    res.json(rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;

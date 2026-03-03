const jwt = require('jsonwebtoken');
const { ApiError } = require('./errorHandler');

// ── Request Logger ────────────────────────────────────────────────────
function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const ms  = Date.now() - start;
    const col = res.statusCode >= 500 ? '\x1b[31m'
              : res.statusCode >= 400 ? '\x1b[33m'
              : '\x1b[32m';
    console.log(`${col}${req.method}\x1b[0m ${req.path} → ${res.statusCode} (${ms}ms)`);
  });
  next();
}

// ── JWT Authentication ─────────────────────────────────────────────────
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new ApiError(401, 'No token provided'));
  }
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;   // { userId, email, role }
    next();
  } catch (err) {
    next(err);            // JsonWebTokenError handled in errorHandler
  }
}

// ── Role Guard ────────────────────────────────────────────────────────
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'Not authenticated'));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, `Requires role: ${roles.join(' or ')}`));
    }
    next();
  };
}

module.exports = { requestLogger, authenticate, requireRole };

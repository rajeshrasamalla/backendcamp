-- ── BackEndCamp Database Schema ─────────────────────────────────────

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(255) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,
  role       VARCHAR(20)  DEFAULT 'user' CHECK (role IN ('user','admin')),
  created_at TIMESTAMP    DEFAULT NOW(),
  updated_at TIMESTAMP    DEFAULT NOW()
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id         SERIAL PRIMARY KEY,
  title      VARCHAR(255) NOT NULL,
  body       TEXT         NOT NULL,
  user_id    INTEGER      REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP    DEFAULT NOW()
);

-- Lesson progress table (tracks what user has completed)
CREATE TABLE IF NOT EXISTS lesson_progress (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  lesson_id  INTEGER NOT NULL,
  passed     BOOLEAN DEFAULT FALSE,
  attempts   INTEGER DEFAULT 0,
  passed_at  TIMESTAMP,
  UNIQUE(user_id, lesson_id)
);

-- ── Seed Data ────────────────────────────────────────────────────────

-- Seed users (password = "password123" hashed with bcrypt rounds=10)
INSERT INTO users (name, email, password, role) VALUES
  ('Alice Admin',  'alice@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
  ('Bob User',     'bob@example.com',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user'),
  ('Carol Dev',    'carol@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user')
ON CONFLICT (email) DO NOTHING;

-- Seed posts
INSERT INTO posts (title, body, user_id) VALUES
  ('Getting Started with Node.js',   'Node.js is a JavaScript runtime...', 1),
  ('REST API Best Practices',        'Always use nouns in your URLs...', 1),
  ('Understanding Async/Await',      'Async functions return promises...', 2),
  ('Docker for Developers',          'Containerize everything!',          3)
ON CONFLICT DO NOTHING;

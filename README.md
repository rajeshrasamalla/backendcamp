# 🚀 BackEndCamp — Interactive Back-End Development Course

A fully self-hosted, freeCodeCamp-style interactive learning platform built with:
- **Node.js + Express** (real API server)
- **PostgreSQL** (real relational database)
- **Redis** (real caching layer)
- **Nginx** (reverse proxy + static frontend)
- **Docker Compose** (orchestrates everything)

---

## ⚡ Quick Start (3 commands)

```bash
# 1. Go into the project folder
cd backendcamp

# 2. Start everything
docker compose up

# 3. Open your browser
open http://localhost:3000
```

That's it. All 4 containers spin up automatically.

---

## 🏗️ Architecture

```
Your Browser (localhost:3000)
        │
        ▼
  ┌─────────────┐
  │    Nginx    │  :80 inside Docker → :3000 on your machine
  │  (frontend) │  serves index.html
  └──────┬──────┘
         │ /api/* proxied to →
         ▼
  ┌─────────────┐
  │   Express   │  :4000 inside Docker
  │     API     │  JWT auth, rate limiting, validation
  └──────┬──────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐  ┌───────┐
│  PG   │  │ Redis │
│  :5432│  │  :6379│
└───────┘  └───────┘
```

---

## 📚 What's Included

### 12 Interactive Lessons
| # | Lesson | Concept |
|---|--------|---------|
| 1 | What is Node.js? | Variables, console.log |
| 2 | Objects & JSON | JSON.stringify, data structures |
| 3 | HTTP Methods | GET, POST, PATCH, DELETE |
| 4 | Your First Express Route | app.get(), req, res |
| 5 | Route Parameters | req.params, req.query |
| 6 | GET – Read Resources | Pagination, cache headers |
| 7 | POST – Create Resources | req.body, validation, 201 |
| 8 | DELETE a Resource | 404, 403, 204 |
| 9 | Writing Middleware | next(), req augmentation |
| 10 | Auth with JWT | Bearer tokens, authentication |
| 11 | Redis Caching | Cache-aside pattern |
| 12 | Error Handling | ApiError class, global handler |

### Real API Endpoints
```
POST   /api/auth/register   Create account
POST   /api/auth/login      Login → get JWT
GET    /api/auth/me         Who am I? (auth)

GET    /api/users           List users (admin)
GET    /api/users/:id       Get user (auth)
PATCH  /api/users/:id       Update name (auth)
DELETE /api/users/:id       Delete user (admin)

GET    /api/posts           List posts (paginated, cached)
GET    /api/posts/:id       Get post
POST   /api/posts           Create post (auth)
PATCH  /api/posts/:id       Update post (auth + ownership)
DELETE /api/posts/:id       Delete post (auth + ownership)

GET    /api/progress        My lesson progress (auth)
POST   /api/progress/:id    Mark lesson complete (auth)

GET    /health              Health check
```

### Seed Accounts (all have password: `password`)
| Email | Role |
|-------|------|
| alice@example.com | admin |
| bob@example.com | user |
| carol@example.com | user |

---

## 🔧 Useful Commands

```bash
# Start in background
docker compose up -d

# See logs
docker compose logs -f api
docker compose logs -f postgres

# Stop everything
docker compose down

# Wipe database and start fresh
docker compose down -v
docker compose up

# Open a shell in the API container
docker exec -it backendcamp_api sh

# Connect to PostgreSQL directly
docker exec -it backendcamp_db psql -U admin -d backendcamp

# Connect to Redis CLI
docker exec -it backendcamp_redis redis-cli
```

---

## 🛠️ Project Structure

```
backendcamp/
├── docker-compose.yml          ← orchestrates all services
├── frontend/
│   └── index.html              ← the entire course UI
├── nginx/
│   └── nginx.conf              ← reverse proxy config
└── backend/
    ├── Dockerfile
    ├── package.json
    ├── db/
    │   └── init.sql            ← creates tables + seed data
    └── src/
        ├── server.js           ← Express entry point
        ├── db/
        │   └── client.js       ← PostgreSQL + Redis clients
        ├── middleware/
        │   ├── logger.js       ← requestLogger + authenticate + requireRole
        │   └── errorHandler.js ← ApiError class + global handler
        └── routes/
            ├── auth.js         ← /api/auth/*
            ├── users.js        ← /api/users/*
            ├── posts.js        ← /api/posts/*
            └── progress.js     ← /api/progress/*
```

---

## 💡 Learning Features

- **Live code editor** with line numbers and Tab support
- **Real test runner** that executes your JS and checks results
- **Live API explorer** — click any endpoint to call the real server
- **Progress saved** — login to persist progress in PostgreSQL
- **Redis caching demo** — call the same endpoint twice, see `"source": "cache"`
- **Hot reload** — edit backend files, the server restarts automatically (nodemon)

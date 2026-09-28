# EarthFateApi

This repository provides the backend API for the EarthFateGame project (a game that lost access to its original API).

**About this project:** This is a personal project to revive a game I built back when I started studying programming. The original game used an external API that is no longer available, so I am rebuilding the backend from scratch, taking the chance to improve the code, add proper structure, and include professional features (auth, persistence, tests) step by step.

The related game project can be found here:

https://github.com/BarreiroReSird/EarthFateGame

The goal is to rebuild a clean, maintainable backend for that game and keep it under this repository going forward.

---

## Setup

### Prerequisites
- Node.js (v18 or higher)
- npm
- A Supabase project (free tier works)

### Installation

```bash
npm install
```

### Running the API

For production (normal mode):
```bash
npm start
```

For development (auto restarts when you edit a file, uses nodemon):
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

### Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3000) |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_KEY` | Your Supabase anon/public key |
| `JWT_SECRET` | Secret key used for signing JWT tokens |
| `BCRYPT_SALT_ROUNDS` | Number of salt rounds for bcrypt hashing |
| `CORS_ORIGIN` | Allowed origins for CORS, comma separated (default: `*`) |
| `RATE_LIMIT_GENERAL_MAX` | Requests per 15 min across the whole API (default: 300) |
| `RATE_LIMIT_AUTH_MAX` | Requests per 15 min on `/auth` (default: 10) |

Get these from **Supabase Dashboard > Settings > API**.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Run the API |
| `npm run dev` | Run with auto-restart (nodemon) |
| `npm test` | Run the test suite with Jest |
| `npm run test:coverage` | Run tests and print a coverage report |
| `npm run lint` | Run ESLint check |
| `npm run format` | Auto-format code with Prettier |

---

## Quick Test (30 seconds)

After starting the API with `npm start`, open a terminal and run these commands **in order**:

**1. Register a test user (returns a JWT token):**
```bash
curl -X POST http://localhost:3000/api/v1/auth/signup -H "Content-Type: application/json" -d '{"username":"testuser","password":"password123"}'
```
Copy the `token` from the response, you will need it on the next steps.

**2. Get the default Dragon character (GET endpoint works in browser too):**
```bash
curl http://localhost:3000/api/v1/characters/random
```

**3. Create your first hero character (using the JWT Bearer token):**
```bash
curl -i -X POST http://localhost:3000/api/v1/characters -H "Content-Type: application/json" -H "Authorization: Bearer <YOUR_JWT_TOKEN>" -d '{"name":"Conan","atk":60,"intelligence":40,"health":250}'
```
The `-i` shows the `Location` header, and the body is the new character, so copy its `id`.

**4. Partially update it (only the sent fields change):**
```bash
curl -X PATCH http://localhost:3000/api/v1/characters/<CHARACTER_ID> -H "Content-Type: application/json" -H "Authorization: Bearer <YOUR_JWT_TOKEN>" -d '{"atk":75}'
```

**5. Check the error format with a bad id:**
```bash
curl http://localhost:3000/api/v1/characters/not-a-valid-id!
# {"error":"Id must be 1 to 64 characters long and contain only letters, numbers, hyphens or underscores"}
```

---

## Available Endpoints

All routes are served under the versioned prefix `/api/v1`.

### General

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | No | Liveness probe (status, uptime, timestamp) |

### Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/auth/signup` | No | Register a new user (returns JWT token) |
| `POST` | `/api/v1/auth/login` | No | Login with username and password (returns JWT token) |

### Characters

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/characters/random` | No | Get a random character (returns a default Dragon if none exist) |
| `GET` | `/api/v1/characters` | Yes | List the authenticated user's characters |
| `POST` | `/api/v1/characters` | Yes | Create a new character |
| `GET` | `/api/v1/characters/:id` | No | Get a character by ID |
| `PATCH` | `/api/v1/characters/:id` | Yes | Partially update a character (owner only) |
| `DELETE` | `/api/v1/characters/:id` | Yes | Delete a character (owner only, returns `204`) |

**`POST /api/v1/characters` request body:**

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `name` | string | Yes | 2–30 characters |
| `atk` | number | Yes | 0–100 |
| `intelligence` | number | Yes | 0–100 |
| `health` | number | Yes | 1–500 |
| `isMonster` | boolean | No | Defaults to `false` |

**`PATCH /api/v1/characters/:id` request body:** every field is optional, but at least one of
`name`, `atk`, `intelligence`, `health` must be present. Fields that are not sent stay unchanged.
`isMonster` and `img` are never editable through this endpoint.

**`POST /api/v1/auth/signup` and `/api/v1/auth/login` request body:**

| Field | Type | Rules |
|-------|------|-------|
| `username` | string | 3–30 characters, must be unique |
| `password` | string | At least 8 characters |

**Response shapes:**

Successful responses always return the resource itself, with no wrapper. Sign up / login:
```json
{
    "id": "uuid",
    "username": "testuser",
    "token": "<JWT>"
}
```

Character (returned by every `/characters` endpoint):
```json
{
    "id": "uuid",
    "name": "Conan",
    "atk": 60,
    "intelligence": 40,
    "health": 250,
    "isMonster": false,
    "img": "hero.png",
    "idPlayer": "uuid"
}
```

`GET /api/v1/characters` returns a bare array, `DELETE` returns `204` with no body, and
`POST /api/v1/characters` also sends a `Location` header pointing at the new resource.

Every error uses the same shape, whether it comes from validation, auth, a missing
resource or an unexpected failure:
```json
{
    "error": "Character not found"
}
```

**Status codes:** `200` OK · `201` Created · `204` No Content (delete) · `400` validation error,
malformed id or malformed JSON · `401` missing/invalid token · `403` not the owner ·
`404` unknown route or character · `409` username already taken · `413` payload above the 10kb
limit · `429` rate limit reached · `500` internal error (details only in the server logs).

---

## Project Structure

Each file has one job, and the routes never talk to the database directly:

```
Routes ──validation──▶ utils/store.js ──▶ Supabase
   │
   └──errors──▶ middleware/errorHandler.js
```

```
API/
├── config/
│   └── index.js              # Central application configuration & environmental constants
├── server.js                 # Entry point: wires middleware, routes and error handling
├── routes/                   # URL, method and permissions. All the business rules live here
│   ├── auth.js               # /auth/signup and /auth/login
│   ├── characters.js         # RESTful character resource
│   └── health.js             # Liveness probe
├── utils/
│   ├── appError.js           # Error carrying an HTTP status code, thrown by the routes
│   ├── store.js              # Database access, the only file that queries Supabase
│   ├── validators.js         # Input validation (credentials, ids, names, stats, patches)
│   ├── validators.test.js    # Unit tests for the validators
│   ├── logger.js             # Structured logging utility
│   ├── logger.test.js
│   └── supabase.js           # Supabase client connection
├── tests/
│   ├── setupEnv.js           # Relaxes the rate limits while testing
│   └── api.test.js           # HTTP tests with the database mocked
└── middleware/
    ├── authMiddleware.js     # JWT Bearer token authentication middleware
    ├── notFound.js           # 404 JSON response for unmatched routes
    └── errorHandler.js       # Central error handling middleware
```
    ├── notFound.js           # 404 JSON response for unmatched routes
    └── errorHandler.js       # Global error handling middleware
```

---

## Dependencies

- express - Web framework
- helmet - Security headers (HSTS enabled in production)
- cors - Cross origin resource sharing
- compression - Response payload compression
- bcrypt - Password hashing
- jsonwebtoken - JWT token authentication
- express-rate-limit - Rate limiting for API endpoints
- @supabase/supabase-js - Supabase client for database access
- dotenv - Load environment variables from .env

## Dev Dependencies

- nodemon - Auto restarts the server during development
- eslint - Code linting
- prettier - Code formatting
- jest - Testing framework
- supertest - HTTP level tests against the Express app

---

## What's Been Built

- RESTful API under a versioned prefix (`/api/v1`) with resource-based paths and no verbs
- Full character CRUD (`GET /random`, `GET /`, `POST /`, `GET /:id`, `PATCH /:id`, `DELETE /:id`)
- Partial updates via `PATCH` with per-field validation (non-updatable fields are ignored)
- Consistent responses: successful requests return the bare resource, every error
  returns `{ "error": "..." }`
- Input validation for bodies, path ids and query values, before any business logic runs
- Centralized error handling with an `AppError` type carrying the HTTP status code,
  so no route builds its own error response
- Liveness endpoint (`GET /health`) and JSON `404` responses for unmatched routes
- `Location` header on `201 Created` pointing at the new resource
- Security headers via `helmet`, with HSTS in production
- Rate limiting across the whole API plus a stricter limit on the auth endpoints
- CORS restricted to a configurable list of origins
- Central configuration module (`API/config/index.js`) for application constants
- Structured logger utility (`API/utils/logger.js`)
- Response compression middleware (`compression`)
- User registration and login with bcrypt password hashing and JWT token authentication
- Dedicated `authMiddleware` for protecting endpoints via HTTP Bearer tokens
- Payload size limiting (10kb) to prevent DoS attacks
- Optimized database pagination for random character generation
- Owner permission checks on character edits and deletes
- Persistent data storage with Supabase (PostgreSQL)
- ESLint + Prettier for code quality
- Test suite (Jest + supertest): validators, logger and 40 HTTP tests with the
  database mocked, covering auth, permissions, validation and error responses
- Environment variable configuration (.env and .env.example)

## What's Next

- Tests for `utils/store.js`, which is only covered by running the API for real
- API documentation (Swagger/OpenAPI)
- Frontend integration (Angular)
- Production deployment (needs a shared rate limit store and TLS termination)


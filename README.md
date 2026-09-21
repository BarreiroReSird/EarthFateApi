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
| `CORS_ORIGIN` | Allowed origins for CORS (default: `*`) |

Get these from **Supabase Dashboard > Settings > API**.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Run the API |
| `npm run dev` | Run with auto-restart (nodemon) |
| `npm test` | Run all unit tests with Jest |
| `npm run lint` | Run ESLint check |
| `npm run format` | Auto-format code with Prettier |

---

## Quick Test (30 seconds)

After starting the API with `npm start`, open a terminal and run these commands **in order**:

**1. Register a test user (returns a JWT token):**
```bash
curl -X POST http://localhost:3000/signup -H "Content-Type: application/json" -d '{"username":"testuser","password":"password123"}'
```

**2. Get the default Dragon character (GET endpoint works in browser too):**
```bash
curl http://localhost:3000/getRandomChar
```

**3. Create your first hero character (using the JWT Bearer token):**
```bash
curl -X POST http://localhost:3000/createCharacter -H "Content-Type: application/json" -H "Authorization: Bearer <YOUR_JWT_TOKEN>" -d '{"name":"Conan","atk":60,"intelligence":40,"health":250}'
```

---

## Available Endpoints

- `POST /signup` - Register a new user (returns JWT token)
- `POST /login` - Login with username and password (returns JWT token)
- `GET /getRandomChar` - Get a random character (returns a default Dragon if no characters exist yet)
- `POST /createCharacter` - Create a new character (requires Bearer token authentication)
- `GET /getChar?characterId=ID` - Get character by ID
- `POST /updateCharacter` - Update character stats (requires Bearer token authentication)

---

## Project Structure

```
API/
├── config/
│   └── index.js              # Central application configuration & environmental constants
├── server.js                 # Entry point: initializes Express, rate limiter, routes and middleware
├── routes/
│   ├── auth.js               # /signup and /login endpoints with JWT generation
│   └── characters.js         # Character endpoints (protected via authMiddleware)
├── utils/
│   ├── logger.js             # Structured logging utility
│   ├── supabase.js           # Supabase client connection
│   ├── store.js              # Database operations (users and characters)
│   ├── validators.js         # Input validation functions (credentials, names, stats)
│   └── validators.test.js    # Unit tests for input validators
└── middleware/
    ├── authMiddleware.js     # JWT Bearer token authentication middleware
    └── errorHandler.js       # Global error handling middleware
```

---

## Dependencies

- express - Web framework
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

---

## What's Been Built

- Central configuration module (`API/config/index.js`) for application constants
- Structured logger utility (`API/utils/logger.js`)
- Response compression middleware (`compression`)
- User registration and login with bcrypt password hashing and JWT token authentication
- Dedicated `authMiddleware` for protecting endpoints via HTTP Bearer tokens
- Rate limiting on authentication endpoints to prevent brute-force attacks
- Payload size limiting (10kb) to prevent DoS attacks
- Character CRUD (create, read, update) with deduplicated input validation
- Optimized database pagination for random character generation
- Owner permission checks on character edits
- Persistent data storage with Supabase (PostgreSQL)
- Layered project structure (config / routes / utils / middleware)
- ESLint + Prettier for code quality
- Unit tests for validators (Jest)
- Environment variable configuration (.env and .env.example)

## What's Next

- API routing standardization (/api/v1/)
- API documentation (Swagger/OpenAPI)
- Frontend integration (Angular)
- Production deployment


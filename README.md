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

Get these from **Supabase Dashboard > Settings > API**.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Run the API |
| `npm run dev` | Run with auto-restart (nodemon) |
| `npm test` | Run all tests |

---

## Quick Test (30 seconds)

After starting the API with `npm start`, open a terminal and run these commands **in order** (step 1 must be done before step 3):

**1. Register a test user:**
```bash
curl -X POST http://localhost:3000/signup -H "Content-Type: application/json" -d '{"username":"testuser","password":"123456"}'
```

**2. Get the default Dragon character (GET endpoint works in browser too):**
```bash
curl http://localhost:3000/getRandomChar
```

**3. Create your first hero character:**
```bash
curl -X POST http://localhost:3000/createCharacter -H "Content-Type: application/json" -d '{"name":"Conan","atk":60,"intelligence":40,"health":250,"username":"testuser","password":"123456"}'
```

---

## Available Endpoints

- `POST /signup` - Register a new user (with bcrypt password hashing)
- `POST /login` - Login with username and password (with bcrypt verification)
- `GET /getRandomChar` - Get a random character (returns a default Dragon if no characters exist yet)
- `POST /createCharacter` - Create a new character (with stats validation and credential check)
- `GET /getChar?characterId=ID` - Get character by ID
- `POST /updateCharacter` - Update character stats (with owner permission check)

---

## Project Structure

```
API/
├── server.js                 # Entry point: initializes Express, registers routes and middleware
├── routes/
│   ├── auth.js               # /signup and /login endpoints
│   └── characters.js         # Character related endpoints (4 endpoints)
├── utils/
│   ├── supabase.js           # Supabase client connection
│   ├── store.js              # Database operations (users and characters)
│   └── validators.js         # Input validation functions (credentials and character stats)
└── middleware/
    └── errorHandler.js       # Global error handling middleware
```

---

## Dependencies

- express - Web framework
- cors - Cross origin resource sharing
- bcrypt - Password hashing
- @supabase/supabase-js - Supabase client for database access
- dotenv - Load environment variables from .env

## Dev Dependencies

- nodemon - Auto restarts the server during development
- eslint - Code linting
- prettier - Code formatting
- jest - Testing framework

---

## What's Been Built

- User registration and login with bcrypt password hashing
- Character CRUD (create, read, update) with input validation
- Owner permission checks on character edits
- Persistent data storage with Supabase (PostgreSQL)
- Layered project structure (routes / utils / middleware)
- ESLint + Prettier for code quality
- Unit tests for validators (Jest)
- Environment variable template (.env.example)

## What's Next

- Proper authentication (JWT tokens)
- API documentation (Swagger/OpenAPI)
- Frontend integration (Angular)
- Production deployment

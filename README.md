# EarthFateApi

This repository provides the backend API for the EarthFateGame project (a game that lost access to its original API).

**About this project:** This is a personal project to revive a game I built back when I started studying programming. The original game used an external API that is no longer available, so I am rebuilding the backend from scratch, taking the chance to improve the code, add proper structure, and include professional features (auth, persistence, tests) step by step.

The related game project can be found here:

https://github.com/BarreiroReSird/EarthFateGame

The goal is to rebuild a clean, maintainable backend for that game and keep it under this repository going forward.

---

## Setup

### Prerequisites
- Node.js (v14 or higher)
- npm

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
│   ├── store.js              # In memory data storage (users and characters arrays)
│   └── validators.js         # Input validation functions (credentials and character stats)
└── middleware/
    └── errorHandler.js       # Global error handling middleware
```

---

## Dependencies

- express - Web framework
- cors - Cross origin resource sharing
- bcrypt - Password hashing

## Dev Dependencies

- nodemon - Auto restarts the server during development
- eslint - Code linting
- prettier - Code formatting
- jest - Testing framework

---

## Roadmap

- [DONE] Environment setup and basic API with all endpoints
- [DONE] Refactor to layered structure (routes, utils, middleware) - clean separation of concerns
- [DONE] Add environment variable template (.env.example)
- [DONE] Setup ESLint + Prettier for code quality
- [DONE] Add unit tests for validators (Jest)
- [TODO] Implement JWT authentication
- [TODO] Implement data persistence (replace in memory storage with a file/database)
- [TODO] API documentation (Swagger/OpenAPI)
- [TODO] Angular integration
- [TODO] Deployment

---

## Current Limitations (Known Trade offs)

This is a work in progress project. I chose to keep things simple first and build incrementally.
Here are the next things to improve:

- **No JWT auth yet:** `/createCharacter` and `/updateCharacter` receive the raw password in each request. Will be fixed with JWT tokens in a future update.
- **In memory storage only:** Data is lost when the server stops. Persistence (file based or database) is the next roadmap item.
- **No rate limiting or brute force protection** on authentication endpoints.

---

## Development Notes

The current implementation uses in memory storage (data is lost when the server stops). Data persistence will be added in the next phase.

The code is organized into a simple 3 layer structure (routes / utils / middleware), chosen to keep the project easy to understand while maintaining a clean separation of concerns:
- Routes deal with HTTP requests and responses
- Validators and storage are reusable and independent of Express
- The entry file (`server.js`) stays small and focused on setup only

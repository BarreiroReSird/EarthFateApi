# EarthFateApi

This repository provides the backend API for the EarthFateGame project (a game that lost access to its original API).

**About this project:** This is a personal project to revive a game I built back when I started studying programming. The original game used an external API that is no longer available, so I am rebuilding the backend from scratch, taking the chance to improve the code, add proper structure, and include professional features (auth, persistence, tests) step by step.

The related game project can be found here:

https://github.com/BarreiroReSird/EarthFateGame

The goal is to rebuild a clean, maintainable backend for that game and keep it under this repository going forward.

---

## Setup

### Prerequisites
- Node.js (v22 or higher)
- npm
- A Google account: the database is a Google Sheet (see `TASKS.md` for setup instructions)

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
| `GOOGLE_SHEET_ID` | Id of the spreadsheet holding the rows (the part of its URL between `/d/` and `/edit`) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `client_email` of the service account that may read and write the sheet |
| `GOOGLE_PRIVATE_KEY` | `private_key` of that service account, with the `\n` escapes kept as they are |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Alternative: the whole key file on one line. Wins over the two above when set |
| `JWT_SECRET` | Secret key used for signing JWT tokens |
| `BCRYPT_SALT_ROUNDS` | Number of salt rounds for bcrypt hashing |
| `CORS_ORIGIN` | Allowed origins for CORS, comma separated. Required in production: a `*` wildcard makes the API refuse to start |
| `RATE_LIMIT_GENERAL_MAX` | Requests per 15 min across the whole API (default: 300) |
| `RATE_LIMIT_AUTH_MAX` | Requests per 15 min on `/auth` (default: 10) |
| `TRUST_PROXY` | Number of reverse proxies in front of the API (default: `false`, set to `1` on Heroku/Render/Cloudflare/nginx) |
| `HSTS_INCLUDE_SUBDOMAINS` | Apply HSTS to subdomains too (default: `false`) |
| `HSTS_PRELOAD` | Ask browsers to preload this domain as HTTPS-only (default: `false`) |

> **`TRUST_PROXY` matters more than it looks.** Express only reads the client IP from
> `X-Forwarded-For` for the proxy hops it trusts. Behind a reverse proxy with this set to
> `false`, every visitor shares a single rate-limit bucket, so the 11th login attempt from
> anyone blocks everyone for 15 minutes. Set it to the exact number of proxies, and never to
> `true` — that lets a client send a fake header and bypass the limits entirely.
>
> `express-rate-limit` is configured to validate this, and it prints
> `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` on the first request when the header arrives on an app
> that does not trust its proxy (and `ERR_ERL_PERMISSIVE_TRUST_PROXY` if the value is `true`).
> Note that it logs the error but still serves the request, so treat that line in the logs as a
> real configuration bug, not a warning you can ignore.

Those four come from a Google service account key. See `TASKS.md` for
instructions on creating one, sharing the spreadsheet with it, and what to do
when the log says something is missing.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Run the API |
| `npm run dev` | Run with auto-restart (nodemon) |
| `npm run seed` | Insert the monsters into the spreadsheet (safe to re-run) |
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
| `GET` | `/health` | No | Liveness probe, returns `{"status":"ok"}` and nothing else |

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
| `isMonster` | boolean | No | Ignored, always `false`. Monsters are seeded in the database |

**`PATCH /api/v1/characters/:id` request body:** every field is optional, but at least one of
`name`, `atk`, `intelligence`, `health` must be present. Fields that are not sent stay unchanged.
`id`, `idPlayer`, `isMonster` and `img` are never editable through this endpoint.

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
malformed id or malformed JSON · `401` missing/invalid token · `404` unknown route, unknown
character, **or a character owned by somebody else** · `409` username already taken · `413` payload
above the 10kb limit · `429` rate limit reached · `500` internal error (details only in the server
logs).

Note the deliberate choice on `404`: editing or deleting someone else's character answers
`404`, not `403`, so the API never confirms that a character you cannot see exists.

### Why the error format works: Express 5

The route handlers are all `async` and report problems by throwing, rather than building a
response themselves:

```js
// routes/characters.js
assertValid(validateCharacterName(name)); // throws AppError.badRequest(...)
```

Those rejections only reach `middleware/errorHandler.js` because this project runs on
**Express 5**, which forwards a rejected promise from a handler to the error middleware on
its own. On Express 4 it would not: the request would hang until it timed out, nothing
would be logged, and the whole `{ "error": "..." }` shape would quietly disappear.

That is why you will not find an `asyncHandler` wrapper anywhere here, and it is also why
there is a test that fails if the project is ever downgraded to Express 4.

---

## Project Structure

Each file has one job, and the routes never talk to the database directly:

```
Routes ──validation──▶ utils/store.js ──▶ Google Sheets
   │
   └──errors──▶ middleware/errorHandler.js
```

```
API/
├── config/
│   └── index.js              # Central application configuration & environmental constants
├── server.js                 # Entry point: createApp() wires middleware, routes
│                             #   and error handling, startServer() listens
├── routes/                   # URL, method and permissions. All the business rules live here
│   ├── auth.js               # /auth/signup and /auth/login
│   ├── characters.js         # RESTful character resource
│   └── health.js             # Liveness probe
├── utils/
│   ├── appError.js           # Error carrying an HTTP status code, thrown by the routes
│   ├── store.js              # Database access, the only file that talks to Google Sheets
│   ├── validators.js         # Input validation (credentials, ids, names, stats, patches)
│   ├── validators.test.js    # Unit tests for the validators
│   ├── logger.js             # Structured logging utility
│   └── logger.test.js
├── scripts/
│   └── seed.js               # Writes the monsters into the spreadsheet (npm run seed)
├── tests/
│   ├── setupEnv.js           # Sets the test environment, ignoring your real .env
│   └── api.test.js           # HTTP tests with the database mocked
└── middleware/
    ├── authMiddleware.js     # JWT Bearer token authentication middleware
    ├── notFound.js           # 404 JSON response for unmatched routes
    └── errorHandler.js       # Central error handling middleware
```

---

## Breaking change: the move to `/api/v1`

The original game called the old verb-based endpoints. They are gone, replaced by a
versioned REST resource. If you have an old client (the Angular app in
[EarthFateGame](https://github.com/BarreiroReSird/EarthFateGame)), it will stop working
until you point it at the new paths:

| Old endpoint | New endpoint |
|--------------|--------------|
| `GET /getRandomChar` | `GET /api/v1/characters/random` |
| `GET /getChars/:playerId` | `GET /api/v1/characters` (JWT, no player id in the path) |
| `POST /createCharacter` | `POST /api/v1/characters` |
| `GET /getChar/:id` | `GET /api/v1/characters/:id` |
| `POST /updateChar/:id` | `PATCH /api/v1/characters/:id` (send only the fields to change) |
| `POST /deleteChar/:id` | `DELETE /api/v1/characters/:id` |
| `POST /signup` | `POST /api/v1/auth/signup` |
| `POST /login` | `POST /api/v1/auth/login` |

The old client was not JSON, so **changing the path is the easy part**. All six calls in
`src/app/services/logins.service.ts` of [EarthFateGame](https://github.com/BarreiroReSird/EarthFateGame)
talk to a PHP API that no longer resolves, and they differ in four ways:

| | Old client | This API |
|---|---|---|
| Request body | `FormData`, so `multipart/form-data` | JSON only; a multipart body is read as empty and fails validation |
| Field names | `int`, `vida` | `intelligence`, `health` |
| Authentication | `username` + `password` re-sent on every write | `Authorization: Bearer <token>`, obtained once from login |
| Success | `{ "code": 200, "data": ... }` with `Nome`, `Atk`, `Int`, `Vida`, `ID_Player` | the bare resource, e.g. `{ "id", "name", "atk", "intelligence", "health", "isMonster", "img", "idPlayer" }` |

So the cheapest migration is to translate inside `logins.service.ts` and leave the
components alone. Putting the shim in this API instead would be faster, but then the
API being demonstrated is not the one that was written.

---

## Dependencies

- express - Web framework
- helmet - Security headers (HSTS enabled in production)
- cors - Cross origin resource sharing
- compression - Response payload compression
- bcrypt - Password hashing
- jsonwebtoken - JWT token authentication
- express-rate-limit - Rate limiting for API endpoints
- google-spreadsheet - Reads and writes the spreadsheet
- google-auth-library - Signs the service account token for Google
- dotenv - Load environment variables from .env

## Dev Dependencies

- nodemon - Auto restarts the server during development
- eslint - Code linting
- prettier - Code formatting
- jest - Testing framework
- supertest - HTTP level tests against the Express app

---

## Comment Conventions

So that comments stay consistent across the codebase:

- **English**, same as the code and the rest of these docs. The private notes
  under `private/` are in Portuguese; the source is not.
- **Block comments above the code**, never trailing on the same line. There is
  not a single line-by-line comment in the project.
- **Explain the *why*, never the *what*.** The code already says what it does.
  A comment earns its place only when it carries a business rule, a technical
  constraint, a trade-off, or context that is not visible in the code.
- **No redundant comments.** `i++ // increments i` is noise.
- **No commented-out code.** Delete it and let Git keep the history.
- **Document a public function when its contract is not obvious from its
  signature** — typically because it throws on some paths and returns normally
  on others, or because its return shape is not its input's. The error contract
  in `utils/store.js` is the case that earns JSDoc here: it decides which
  failures become a `null` (no such row, which is an answer) and which become a
  500 (the spreadsheet could not be read), and neither is visible from the
  parameter list. A validator that takes a string and returns
  `{ valid, message }` says all of that on its own. Endpoints are documented
  under [Endpoints](#endpoints) with auth, body, status codes and examples.
- **No TODOs in the source.** Open work lives in `TASKS.md` with the reason
  attached, which is more useful than a marker in a file.
- **No agent or tool attribution in the source.** If the use of a tool is worth
  recording, it belongs in the commit, the PR or this file, not in a comment.
- **When the code changes, the comment changes with it.** A stale comment is
  worse than no comment, because it is trusted and wrong.

---

## What's Been Built

- RESTful API under a versioned prefix (`/api/v1`) with resource-based paths and no verbs
- Full character CRUD (`GET /random`, `GET /`, `POST /`, `GET /:id`, `PATCH /:id`, `DELETE /:id`)
- Partial updates via `PATCH` with per-field validation (non-updatable fields are ignored)
- Consistent responses: successful requests return the bare resource, every error
  returns `{ "error": "..." }`
- Input validation for request bodies and path ids, before any business logic
  runs (the API takes no query parameters today)
- Centralized error handling with an `AppError` type carrying the HTTP status code,
  so no route builds its own error response
- Liveness endpoint (`GET /health`) and JSON `404` responses for unmatched routes
- `Location` header on `201 Created` pointing at the new resource
- Security headers via `helmet`, with HSTS in production and a configurable
  `includeSubDomains`
- Rate limiting across the whole API plus a stricter limit on the auth endpoints,
  with a validation that refuses to run if the proxy configuration would make the
  limits meaningless (`TRUST_PROXY`)
- CORS restricted to a configurable list of origins, matched exactly (a suffix
  such as `example.com.evil.net` does not match `https://example.com`). In
  production the API refuses to start unless every entry is an `https` origin
  with no wildcard and no path, so a frontend cannot end up locked out by a
  silently wrong list
- Graceful shutdown on `SIGTERM`/`SIGINT`, so a rolling deploy does not cut
  requests that are still in flight
- Central configuration module (`API/config/index.js`) for application constants
- `createApp()` factory, so a test can build the API with different settings
  (that is how the rate limit tests work) instead of reloading the module
- Structured logger utility (`API/utils/logger.js`)
- Response compression middleware (`compression`)
- User registration and login with bcrypt password hashing and JWT token authentication
- Dedicated `authMiddleware` for protecting endpoints via HTTP Bearer tokens
- Payload size limiting (10kb) to prevent DoS attacks
- Random character with a single read of the whole tab, falling back to a
  built-in monster when the sheet is empty
- Owner permission checks on character edits and deletes, answering `404` instead of
  `403` so the API does not reveal other players' characters
- Server-controlled `isMonster` and `img` fields, so no field outside the documented
  set can be written by a caller
- Persistent data storage in a Google Sheet, with both tabs and their column
  headers created on first connection and verified on every boot
- ESLint + Prettier for code quality
- Test suite (Jest + supertest): validators, logger and HTTP tests with the database
  mocked, covering auth, permissions, validation, rate limiting and error responses.
  The tests set their own environment, so they never read your real `.env`
- Environment variable configuration (.env and .env.example)

## What's Next

The datastore now answers: `API/utils/store.js` reads and writes a Google Sheet,
so signup, login and every character route return real rows once the Google Sheet
setup is complete. `GET /health` returns `200` regardless, which is why it is
not proof that the database works.

See `TASKS.md` for the full list of what is left to do, including:
- **Connect the Angular client** - the game is unusable until the contract described
  under *Breaking change* is translated in the client
- **Add `config/env.js` validation** - to fail early if environment variables are missing
- **Test `utils/store.js` for real** - the HTTP tests mock it, so the queries never
  actually ran
- **API documentation (OpenAPI spec)** - see `TASKS.md` for details
- **And more** - security reviews, user profile endpoints, deployment, etc.


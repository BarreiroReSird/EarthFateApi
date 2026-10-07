# Tasks

Things I still need to do, in order of importance.

## First: make the game work with the API

Goal: `node API/server.js` starts and the game responds, even with bugs. Nothing
below is worth doing until this works, because this is what I can actually show.
The API is ready; the only problem is the database not answering, so this is a
database task, not an API task.

- [x] Choose the database and connect it. I went with Google Sheets, using
      `google-spreadsheet` + `google-auth-library`. I only changed one file,
      `utils/store.js`, and eight functions. The 98 tests that already existed
      mock that module, so they kept passing (this is what made me feel safe to
      change it).
- [x] Define the schema. It's not SQL: the schema is the tab names and header
      rows in the `TABLES` constant at the top of `utils/store.js`, created and
      checked on the first connection. An empty spreadsheet is enough, and an
      empty `characters` tab still uses the fixed Dragon from `DEFAULT_MONSTER`.
- [x] `utils/store.js` talking to Google Sheets. The eight functions now read
      and write rows through the Sheets API. The connection, credential parsing
      and header checking are lazy, on the first query, so the tests keep running.
- [x] Create some monsters for testing. `npm run seed` writes five monsters,
      idempotently; `monster_1` (the Dragon) is what `DEFAULT_MONSTER` and the
      README depend on.
- [ ] Connect the game to the new API. The frontend is in
      `D:\Barreiro\Biblioteca\EarthFateGame` (Angular 15, standalone, already
      cloned). The six calls are in `src/app/services/logins.service.ts` and
      still point to the old PHP backend, `http://moreiramoises.pt/server/apis/`.
      The old contract and the new one don't match in three things:
      - **Request format.** The game sends `FormData`, so the body arrives as
        `multipart/form-data`. The API only accepts JSON and urlencoded, so the
        body looks empty and would give error `400` on everything.
      - **Field names.** The game sends `int` and `vida` where the API expects
        `intelligence` and `health`, and it sends `username`/`password` again
        on every create and upgrade where the API expects a JWT in the
        `Authorization` header.
      - **Response format.** The game reads `data['code'] == 200` and then
        `data['data']`, with Portuguese PascalCase fields
        (`Nome`, `Atk`, `Int`, `Vida`, `ID_Player`) and a `Personagens[0]`
        array. The API returns the resource directly on success and
        `{"error": "..."}` on error.
- [ ] Easiest path: translate in the client service, not in the API.
      Rewrite `logins.service.ts` to speak the new contract and return the old
      format, so the four components that access the fields stay untouched.
      This keeps the API JSON-only and consistent, which is what I actually want
      to show. Adding the shim to the API would be faster, but then it wouldn't
      be the API I wrote.
- [x] Set `CORS_ORIGIN` to the game's dev origin (`http://localhost:4200`) —
      done in `.env`, which is not committed. `.env.example` already had it.
- [ ] `isMonset` is a typo in the game, and the old PHP API returned it that way
      too (`IsMonset`). The new API spells it `isMonster`. Worth fixing while
      the code is open, or at least knowing why the name is inconsistent.

### What is ok to skip for the demo

- [ ] Skip all of it: shared rate limit store, account lockout, token
      revocation, login timing difference, HTTPS, and any deployment. All of this
      is in `SECURITY-TASKS.md` and doesn't matter for a single local instance.
      I won't spend the day on this.
- [ ] Don't skip: signup, login, create, list, random, patch, delete, and CORS.
      This is the demo. A `500` on any of them means the game is broken, not
      "rough around the edges".

### Definition of done

The API is serving real data from a real database and the game shows it. Test
with this, which is the path the game will follow:

```bash
node API/server.js
curl http://localhost:3000/health
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"Demo12345"}'
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"Demo12345"}'
curl http://localhost:3000/api/v1/characters/random
```

All four must answer `200`. `/health` already does today; the other three are
the whole task. If they answer `500`, it's still a database problem.

## Done: leaving Supabase

Supabase is gone: the project doesn't resolve, `API/utils/supabase.js` was
deleted, `@supabase/supabase-js` is out of `package.json`, and the `SUPABASE_*`
settings are out of `config`, `.env.example` and `API/tests/setupEnv.js`. The
migration kept the property that made this safe — only `utils/store.js` talks to
storage and every HTTP test mocks it, so **the 98 tests were green before,
during and after**.

### The decision: Google Sheets

I chose this against the criteria above, for a demo with five players and a
project that has to be explainable:

- [x] `characters.id` stays as text. Cells are text; the slugs I seed
      (`monster_1`, `DEFAULT_MONSTER`) don't need migration.
- [x] Explainable in one sentence: "the rows live in a spreadsheet, and one
      file knows how to talk to it."
- [x] Free, one account, no card, no hosted service that can go down —
      except that it now needs internet and Google, which is the accepted trade-off.
      What made the old setup unusable was a host that didn't resolve *while the
      code was fine*; here a missing credential says so by name in the log.
- [x] Supports the eight functions. Whole-tab reads instead of `COUNT` +
      `ORDER BY`, which is fine for a few dozen rows and is written down as a
      limit in `SETUP-GOOGLE-SHEETS.md`.
- [x] Node. `google-spreadsheet` needs Node 22 (its `ky` dependency is
      ESM-only and Jest's CommonJS loader can't parse it), so the connection is
      made on the first query instead of on require.

I accepted this, and it's worth saying in an interview: no transactions, no
constraints (signup checks the username itself), ~60 writes per minute, and
reads that scale with the size of the tab.

### What is left of the migration

- [ ] Test `utils/store.js` for real. The HTTP tests mock it, so the queries
      never actually ran. Now I can: fill in `.env`, run `npm run seed`, and
      test each of the eight functions by hand.
- [ ] Verify the happy path end-to-end: signup, login, create a character,
      list, random, patch, delete. This is the demo path and it never ran
      against a real database.
- [ ] Commit the datastore change on its own, so it's reviewable apart from the
      API behavior it doesn't change.

## Features and fixes

- [ ] Add `config/env.js` validation (fail early principle). Create a centralized
      `loadEnv()` function that validates all required environment variables on
      startup and throws if any are missing. This follows the "fail fast"
      philosophy instead of the current approach of reading `process.env`
      directly in `config/index.js`.
- [ ] Review the API security. I already did two audits of auth, authorization,
      input validation and error responses. They fixed the missing `TRUST_PROXY`,
      the `isMonster` mass assignment, the `403` that confirmed other players'
      characters, the `uptime` leaked by `/health`, a permissive
      `CORS_ORIGIN=*` in `.env.example`, silent CORS origin misconfigurations
      (`https://*.example.com` would load but match nothing), and a production
      boot with no graceful shutdown. Permission failures are now logged instead
      of silently 404ing. What is still open is in `SECURITY-TASKS.md`: shared
      rate limit store, account lockout, login timing difference, token
      revocation, HTTPS.
- [ ] User profile endpoints (change password, etc.)
- [ ] Limit how many characters a user can create
- [ ] API documentation (OpenAPI). Write the spec, then decide about the UI
      separately, because they are not the same task:
      - [ ] The spec first. A hand-written `openapi.yaml` describing the nine
            routes, their auth, bodies and status codes. Zero runtime impact, no
            new dependency, and it's the part with lasting value: a recruiter
            can read the whole API without running it. The endpoint table in the
            README can then be checked against it instead of being maintained by
            hand.
      - [ ] Then decide whether to serve Swagger UI, and if so, accept what it
            costs. `swagger-ui-express` serves HTML from the API, which breaks
            the stated reason `contentSecurityPolicy: false` is set in
            `API/server.js` (the comment says no HTML is served), adds an
            interactive console pointed at your own API, needs `CORS_ORIGIN` to
            allow its own origin, and is another dependency to keep patched.
      - [ ] Cheaper path that keeps the API JSON-only: serve `openapi.yaml`
            as a static file from one read-only route and view it with Swagger
            UI from a CDN, Postman, or Insomnia. CSP stays off for the reason
            already documented, the production CORS guard stays strict, and
            there is no new runtime dependency.
- [ ] Angular integration
- [ ] Deployment

## Code quality

- [x] JSDoc on `utils/store.js`. The eight exports are documented because the
      error contract is not visible from the signature: a missing row is a
      `null`, an unreadable spreadsheet is a 500, and which is which is only in
      the comment. The other exports (`validators`, `AppError`, the middleware)
      are self-describing, and the routes are documented in the README. Add JSDoc
      when the contract stops being obvious, not by default.
- [ ] Tests for `utils/store.js` (verify what you mock). The HTTP tests mock it,
      so the queries never actually ran. Now they can, against a real spreadsheet
      — see "Done: leaving Supabase" for what is needed. Mocks are only safe if
      the real implementation is also tested.
- [x] HTTP security tests. Malformed JSON, oversized payloads, malformed ids
      before any database call, rate limiting, and per-client bucketing with and
      without a trusted proxy. There are no injection tests because no query is
      ever built: the Sheets row API takes an id or a range, never a string the
      caller shaped. The production boot guards are covered in
      `API/tests/config.test.js`.
- [ ] Unit tests for validators. The validators in `utils/validators.js` are
      pure functions and should have unit tests in `test/unit/`. This is cheap
      coverage and follows the "test as documentation" principle.

## Nice to have

- [ ] eslint-plugin-jest
- [ ] Husky pre-commit hooks
- [x] `engines` field in package.json. The datastore decided this: Node 22 or
      higher, because `google-spreadsheet` pulls in `ky`, which is ESM-only and
      needs it (and Jest's CommonJS loader can't parse `ky` at all, which is why
      `utils/store.js` requires the library on the first query)
- [ ] Docker setup

---

## Architectural decisions and trade-offs

This project makes specific architectural choices, documented here for clarity:

### 1. Database: Google Sheets
**Why:** For a demo with a few players, Google Sheets is free, needs no card,
no hosted service that can go down, and every row is visible in a tab. One file
(`utils/store.js`) knows how to talk to it, so swapping for SQLite/Postgres
later is rewriting one file.

**Trade-offs:**
- No transactions, no constraints (signup checks the username itself)
- ~60 writes per minute, reads scale with tab size
- Needs internet and Google (the original problem was the PHP API not resolving)
- Whole-tab reads instead of `COUNT` + `ORDER BY` (fine for a few dozen rows)

**Layering principle:** The layering rule ("only services/ touches the database")
is kept — `utils/store.js` is the only file that talks to Google Sheets.

### 2. No explicit permission matrix
**Current approach:** Authorization is checked per-handler in the routes (owner
checks on character edits/deletes). Auth is centralized (`authMiddleware.js`),
but the permission matrix doesn't exist.

**Why accepted:** The game only has two roles: "owner of this character" and
"not owner". A full permission matrix would be overkill for this domain.
However, if the domain grows, this should be refactored to centralize
authorization.

**Separation of concerns:** The "auth ≠ authorization" principle is kept, just
not centralized in a matrix file.

### 3. No migrations, no seeds with fixed IDs
**Current approach:** Schema is created/verified on first connection in
`utils/store.js` (`TABLES` constant). Seed uses auto-generated IDs (UUIDs).

**Why accepted:** Google Sheets has no migration system. The schema is defined
in `TABLES` and verified on every boot. Seeds use UUIDs because that's what the
character API already used. The HTTP tests mock the datastore, so they don't
depend on specific seed IDs.

### 4. No workflow tests
**Current approach:** HTTP tests cover the CRUD paths, but there are no explicit
workflow tests.

**Why accepted:** The character domain has no state machine (characters don't
transition between states). When a feature with a state machine is added (e.g.,
battles, quests), workflow tests should be added.

**Test philosophy:** The "test-first for each business rule" principle is
followed for validation and HTTP contract tests. Workflow tests are missing
because the domain doesn't have workflows yet.

### 5. No `config/env.js` validation
**Current approach:** Environment variables are read directly from `process.env`
in `config/index.js` with minimal validation.

**Why accepted:** The current setup validates what it needs, but not in a
centralized `loadEnv()` function. This is a deviation from the "fail early"
principle and should be added if there is time.

---

## Prioritization

Focus on: test quality, security, and documentation instead of new features.
This order reflects that:

1. Integration with the Angular game (the demo must work)
2. Add `config/env.js` validation (fail early principle)
3. Test `utils/store.js` against real Google Sheets (verify what you mock)
4. OpenAPI spec (documentation is part of delivery)
5. Add permission matrix if the domain grows (centralize authorization)
6. Everything else (features, deployment, nice-to-haves)

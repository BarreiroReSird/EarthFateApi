# Tasks

Things I still need to do, roughly ordered by importance.

## Features and fixes

- [ ] **Review the API security.** Two audits of auth, authorization, input
      validation and error responses have happened. They fixed the missing
      `TRUST_PROXY`, the `isMonster` mass assignment, the `403` that confirmed
      other players' characters, the `uptime` leaked by `/health`, a permissive
      `CORS_ORIGIN=*` in `.env.example`, silent CORS origin misconfigurations
      (`https://*.example.com` would have loaded and matched nothing), and a
      production boot with no graceful shutdown. Ownership failures are now
      logged instead of silently 404ing. What is still open is in
      `SECURITY-TASKS.md`: shared rate limit store, account lockout, login timing
      difference, token revocation, HTTPS.
- [ ] **Move off Supabase.** The API only reaches the database through
      `utils/store.js`, so this is contained (plus `config`, `.env` and the
      README). Compare options first: Google Sheets is a spreadsheet, not a
      database, and has no transactions, no indexing and unstable row order, so
      concurrent writes are prone to silently overwriting each other. Cheaper
      alternatives: keep Supabase, SQLite via `better-sqlite3`, or Turso/libSQL.
- [ ] User profile endpoints (change password, etc.)
- [ ] Limit how many characters a user can create
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Angular integration
- [ ] Deployment

## Code quality

- [x] **JSDoc on `utils/store.js`.** Its eight exports are documented because
      their error contract is not visible from the signature: which Supabase
      errors become a `null` and which become a 500. The other exports
      (`validators`, `AppError`, the middleware) are self-describing, and the
      routes are documented in the README. Add JSDoc when a contract stops
      being obvious, not by default.
- [ ] Tests for `utils/store.js`. The HTTP tests mock it, so the Supabase
      queries are only verified by running the API for real.
- [x] **HTTP security tests.** Malformed JSON, oversized payloads, malformed ids
      before any database call, rate limiting, and per-client bucketing with and
      without a trusted proxy. There are no injection tests because no query is
      ever built by concatenating input: every one goes through the Supabase
      client. The production boot guards are covered in `API/tests/config.test.js`.
- [ ] Confirm the `characters.id` column type in Supabase. The API accepts any
      id matching `[A-Za-z0-9_-]{1,64}` so seeded slugs such as `monster_1` keep
      working. If the column is `uuid`, a slug id would surface as a 500 from
      Postgres instead of a 400.

## Nice to have

- [ ] eslint-plugin-jest
- [ ] Husky pre-commit hooks
- [ ] engines field in package.json
- [ ] Docker setup

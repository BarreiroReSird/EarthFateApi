# Tasks

Things I still need to do, roughly ordered by importance.

## Features and fixes

- [ ] **Review the API security.** An audit of auth, authorization, input validation
      and error responses already happened: it fixed the missing `TRUST_PROXY`, the
      `isMonster` mass assignment, the `403` that confirmed other players' characters
      and the `uptime` leaked by `/health`. What is still open is in
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

- [ ] JSDoc on the functions
- [ ] Tests for `utils/store.js`. The HTTP tests mock it, so the Supabase
      queries are only verified by running the API for real.
- [ ] Security tests (injection, oversized payloads)
- [ ] Confirm the `characters.id` column type in Supabase. The API accepts any
      id matching `[A-Za-z0-9_-]{1,64}` so seeded slugs such as `monster_1` keep
      working. If the column is `uuid`, a slug id would surface as a 500 from
      Postgres instead of a 400.

## Nice to have

- [ ] eslint-plugin-jest
- [ ] Husky pre-commit hooks
- [ ] engines field in package.json
- [ ] Docker setup

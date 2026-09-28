# Tasks

Things I still need to do, roughly ordered by importance.

## First: get the game talking to a running API

Goal: `node API/server.js` and the game responding, even with bugs. Nothing below
this is worth doing until this is, because it is the thing that is actually
demonstrable. The API itself is finished; the only thing missing is a database
that answers, so this is a database task, not an API task.

- [ ] **Choose the datastore, then wire it up.** One file, `utils/store.js`, and
      eight functions change. The 98 existing tests mock that module, so they
      stay green throughout whatever is chosen.
- [ ] **`schema.sql`** with `users` and `characters` (columns already fixed by
      the code, see below). An empty `characters` table is enough to start:
      `GET /api/v1/characters/random` falls back to the hardcoded Dragon from
      `DEFAULT_MONSTER`, so something shows up immediately.
- [ ] **`utils/store.js` against the chosen datastore.** One file, eight
      functions. The 98 existing tests mock this module, so they stay green
      throughout.
- [ ] **Seed a few monsters** so the random endpoint shows real data instead of
      the fallback. `monster_1` is referenced by `DEFAULT_MONSTER` and by the
      README, so keep that id.
- [ ] **Point the game at it.** The frontend is a separate repository
      (`EarthFateGame`, on GitHub) and is **not** in `D:\Barreiro\Biblioteca`, so
      it has to be cloned and pointed at `http://localhost:3000`. The old game
      called verb-based endpoints like `getRandomChar`, so the calls in the
      frontend need updating to the `/api/v1` routes. Nobody has checked how many
      there are yet, which is the unknown in this task.
- [ ] **Set `CORS_ORIGIN`** to the game's dev origin (`http://localhost:4200`) or
      the browser will block every request. This is already the value in
      `.env.example`; the real one goes in `.env`, which is not committed.

### What is acceptable to skip for a demo

- [ ] Skip, all of it: shared rate limit store, account lockout, token
      revocation, the login timing difference, HTTPS, and any deployment. All are
      in `SECURITY-TASKS.md` and none of them matter for a single local
      instance. Do not spend the day on them.
- [ ] Do not skip: signup, login, create, list, random, patch, delete, and CORS.
      Those are the demo. A `500` on any of them means the game is broken, not
      "rough around the edges".

### Definition of done

The API is serving real data from a real database and the game shows it. Check
it with this, which is the path the game will follow:

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

All four answer `200`. `/health` already does today; the other three are the
whole task. If they answer `500`, it is still the database.

## Next: leaving Supabase

Supabase is being dropped, so the unreachable project is no longer a bug to fix
in `.env` — it is just the old backend going away. The API code is complete and
none of it is wasted: only `utils/store.js` talks to a database, and every HTTP
test mocks that module, so **the whole test suite stays green across the
migration**. That is the property that makes this safe to do.

Deciding where the data goes is now the first real decision, not something
conditional on what the Supabase dashboard shows.

### Decide the new datastore

No candidate is decided yet, so this is the criteria rather than a shortlist.
Compare options against these, in this order of weight:

- [ ] **It must keep `characters.id` as text.** The seeded slugs (`monster_1`,
      `DEFAULT_MONSTER`, the validator, the README) all assume a string key. A
      store that only accepts UUIDs rules the whole thing out, and each one
      imposes that choice differently.
- [ ] **It must not be a service that can be down while developing.** That is the
      failure that made this project unusable on its own: a host that did not
      resolve, turning every endpoint into a 500 while the code was fine.
- [ ] **It must be explainable in one sentence to a recruiter.** A portfolio
      project is judged on whether the decision can be defended, so favour the
      option whose answer is obvious over the one with the best throughput.
- [ ] **It must support the eight queries in `utils/store.js`**, which means a
      real `COUNT` for the random pick and a real `ORDER BY ... LIMIT 1`. A
      spreadsheet is not a database: no transactions, no indexing, unstable row
      order, and concurrent writes overwriting each other.
- [ ] **Cost and accounts.** Note whether it needs an account, a card, and a
      hosted service, and whether the free tier is enough for a demo.
- [ ] **Node version.** Some stores are built into the runtime and some need a
      dependency, which makes `engines` in `package.json` (still on the
      nice-to-have list) a real constraint rather than a cosmetic one.

### Write the schema, and it does not block the decision

- [ ] **Write the schema once the shape is settled, in plain SQL.** Keep it in
      the repository:
      there is no `.sql` file and no migration anywhere today, only JavaScript
      in `utils/store.js`, which is why the shape of the data is currently known
      only to the code.
- [ ] The columns are already determined by what the code uses:
      `users` needs `id`, `username`, `password`;
      `characters` needs `id`, `name`, `atk`, `intelligence`, `health`,
      `isMonster`, `img`, `idPlayer`. Only the types and nullability are open.
- [ ] `idPlayer` is the ownership link between the two tables and should be a
      real foreign key, which the Supabase version never had. Free correctness,
      and easy to explain.

### Check whether any data is worth keeping

- [ ] Open the Supabase dashboard. The project does not resolve in DNS, so
      there may be nothing to export. If data survives, export it while the
      project still exists, into a format the new import can read. If it does
      not resolve at all, close this out and start clean — there is nothing
      worth recovering and no point spending time on it.

### Then, in this order

- [ ] **Rewrite `utils/store.js` against the new database.** Eight functions,
      one file. The Supabase query builder goes away and explicit SQL replaces
      it. This is the only file that changes substantively.
- [ ] Update `config` (drop `SUPABASE_URL`/`SUPABASE_KEY` for the new setting),
      `.env.example`, `API/tests/setupEnv.js`, and the README. Delete
      `API/utils/supabase.js`.
- [ ] **Test `utils/store.js` for real**, which was impossible until now: the
      HTTP tests mock it, so the queries have never actually run. Whether this is
      practical depends on the choice above, since it costs a different amount of
      effort per store.
- [ ] **Verify the happy path end to end:** signup, login, create a character,
      list, random, patch, delete. This is the demo path and it has never run
      against a real database.
- [ ] Commit the migration on its own, so the datastore change is reviewable
      apart from the API behaviour it does not change.

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
- [ ] User profile endpoints (change password, etc.)
- [ ] Limit how many characters a user can create
- [ ] **API documentation (OpenAPI).** Write the spec, then decide about the UI
      separately, because they are not the same task:
      - [ ] **The spec first.** A hand-written `openapi.yaml` describing the nine
            routes, their auth, bodies and status codes. Zero runtime surface, no
            new dependency, and it is the part that has lasting value: a
            recruiter can read the whole API without running it. The endpoint
            table in the README can then be checked against it instead of being
            maintained by hand.
      - [ ] **Then decide whether to serve Swagger UI, and if so, accept what it
            costs.** `swagger-ui-express` serves HTML from the API, which breaks
            the stated reason `contentSecurityPolicy: false` is set in
            `API/server.js` (the comment says no HTML is served), adds an
            interactive console pointed at your own API, needs `CORS_ORIGIN` to
            allow its own origin, and is another dependency to keep patched.
      - [ ] **Cheaper path that keeps the API JSON-only:** serve `openapi.yaml`
            as a static file from one read-only route and view it with Swagger
            UI from a CDN, Postman, or Insomnia. CSP stays off for the reason
            already documented, the production CORS guard stays strict, and there
            is no new runtime dependency.
- [ ] Angular integration
- [ ] Deployment

## Code quality

- [x] **JSDoc on `utils/store.js`.** Its eight exports are documented because
      their error contract is not visible from the signature: which Supabase
      errors become a `null` and which become a 500. The other exports
      (`validators`, `AppError`, the middleware) are self-describing, and the
      routes are documented in the README. Add JSDoc when a contract stops
      being obvious, not by default.
- [ ] Tests for `utils/store.js`. The HTTP tests mock it, so the queries have
      never actually run. How hard this is to test depends on the datastore
      chosen.
- [x] **HTTP security tests.** Malformed JSON, oversized payloads, malformed ids
      before any database call, rate limiting, and per-client bucketing with and
      without a trusted proxy. There are no injection tests because no query is
      ever built by concatenating input: every one goes through the Supabase
      client. The production boot guards are covered in `API/tests/config.test.js`.

## Nice to have

- [ ] eslint-plugin-jest
- [ ] Husky pre-commit hooks
- [ ] `engines` field in package.json, which becomes a real constraint once the
      datastore is chosen and whatever it needs is known
- [ ] Docker setup

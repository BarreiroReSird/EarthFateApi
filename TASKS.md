# Tasks

Things I still need to do, roughly ordered by importance.

## Features and fixes

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

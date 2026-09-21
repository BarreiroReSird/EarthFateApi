# Tasks

Things I still need to do, roughly ordered by importance.

## Features and fixes

- [ ] Arrays are slow for lookups, switch to Maps
- [ ] Express 5 handles async errors automatically, the try/catch blocks are redundant
- [ ] API prefix like /api/v1/
- [ ] Health check endpoint
- [ ] DELETE for characters and users
- [ ] Partial updates for characters (PATCH)
- [ ] User profile endpoints (change password, etc.)
- [ ] List all characters for a user
- [ ] Limit how many characters a user can create
- [ ] Jest config with coverage thresholds
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Angular integration
- [ ] Deployment
- [ ] Standardize routes with RESTful conventions (GET /api/v1/characters/random, GET /api/v1/characters/:id, POST /api/v1/characters, PATCH /api/v1/characters/:id)

## Code quality

- [ ] JSDoc on the functions
- [ ] Document request/response formats in the README
- [ ] Tests for the error handler
- [ ] Edge case tests for validators (NaN, null, Infinity)
- [ ] Security tests (injection, oversized payloads)

## Nice to have

- [ ] eslint-plugin-jest
- [ ] Husky pre-commit hooks
- [ ] engines field in package.json
- [ ] Docker setup

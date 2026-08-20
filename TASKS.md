# Tasks

Things I still need to do, roughly ordered by importance. Checkboxes get ticked as stuff gets done.

## Features and fixes

- [ ] Arrays are slow for lookups, switch to Maps
- [ ] Node.js version in README said v14, should be v18+
- [ ] Express 5 handles async errors automatically, the try/catch blocks are redundant
- [ ] getRandomChar uses a fixed id ("monster_1") but random stats every request -- make it consistent
- [ ] Proper logging (not just console.log)
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

## Code quality

- [ ] Name validation duplicated in createCharacter and updateCharacter -- extract to validators.js
- [ ] Magic numbers everywhere (monster stats, bcrypt rounds, etc.) -- pull them into config
- [ ] Add compression middleware
- [ ] JSDoc on the functions
- [ ] Document request/response formats in the README
- [ ] Tests for the error handler
- [ ] Edge case tests for validators (NaN, null, Infinity)
- [ ] Security tests (injection, oversized payloads)
- [ ] Bcrypt salt rounds should come from env var
- [ ] Set an explicit body size limit in express.json()

## Nice to have

- [ ] eslint-plugin-jest
- [ ] Husky pre-commit hooks
- [ ] engines field in package.json
- [ ] Docker setup
- [ ] Better .env.example with comments

jest.mock('../utils/store');

const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createApp } = require('../server');
const { JWT_SECRET, RATE_LIMITS, DEFAULT_MONSTER } = require('../config');
const store = require('../utils/store');

const app = createApp();

const USER_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_USER_ID = '22222222-2222-4222-8222-222222222222';
const CHAR_ID = '33333333-3333-4333-8333-333333333333';

const authHeader = (id = USER_ID) => ['Authorization', `Bearer ${signToken(id)}`];

const signToken = (id = USER_ID) =>
    jwt.sign({ id, username: 'testuser' }, JWT_SECRET, { expiresIn: '1h' });

const character = {
    id: CHAR_ID,
    name: 'Conan',
    atk: 60,
    intelligence: 40,
    health: 250,
    isMonster: false,
    img: 'hero.png',
    idPlayer: USER_ID,
};

const hashOf = (password) => bcrypt.hash(password, 10);

beforeEach(() => {
    jest.clearAllMocks();
});

describe('GET /health', () => {
    it('should report the service as ok', async () => {
        const res = await request(app).get('/health');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: 'ok' });
    });

    it('should send the security headers added by helmet', async () => {
        const res = await request(app).get('/health');

        expect(res.headers['x-content-type-options']).toBe('nosniff');
        expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
        expect(res.headers['x-dns-prefetch-control']).toBe('off');
    });

    it('should not send HSTS outside production', async () => {
        const res = await request(app).get('/health');

        expect(res.headers['strict-transport-security']).toBeUndefined();
    });

    it('should report a rate limit budget on every request', async () => {
        const res = await request(app).get('/health');

        expect(res.headers['ratelimit-policy']).toMatch(/^\d+;w=\d+$/);
    });

    it('should hold auth requests to a stricter limit than the rest of the API', async () => {
        const authRes = await request(app).post('/api/v1/auth/login').send({});
        const healthRes = await request(app).get('/health');

        const authLimit = Number(authRes.headers['ratelimit-policy'].split(';')[0]);
        const generalLimit = Number(healthRes.headers['ratelimit-policy'].split(';')[0]);

        expect(authLimit).toBeLessThan(generalLimit);
    });
});

describe('rate limiting', () => {
    // Each app gets its own counter, so a low limit can be used without
    // affecting the other tests.
    const appWithLimits = ({ general, auth }) =>
        createApp({
            rateLimits: {
                GENERAL: { ...RATE_LIMITS.GENERAL, MAX_REQUESTS: general },
                AUTH: { ...RATE_LIMITS.AUTH, MAX_REQUESTS: auth },
            },
        });

    it('should answer 429 once the auth limit is passed', async () => {
        const limitedApp = appWithLimits({ general: 100, auth: 2 });
        const login = () =>
            request(limitedApp)
                .post('/api/v1/auth/login')
                .send({ username: 'testuser', password: 'password123' });

        await login();
        await login();
        const res = await login();

        expect(res.status).toBe(429);
        expect(res.body).toEqual({
            error: 'Too many authentication attempts, please try again later.',
        });
    });

    it('should answer 429 for the whole API once the general limit is passed', async () => {
        const limitedApp = appWithLimits({ general: 1, auth: 100 });

        await request(limitedApp).get('/health');
        const res = await request(limitedApp).get('/health');

        expect(res.status).toBe(429);
        expect(res.body).toEqual({ error: 'Too many requests, please try again later.' });
    });

    it('should not start counting before the limiter is reached', async () => {
        const limitedApp = appWithLimits({ general: 2, auth: 100 });

        expect((await request(limitedApp).get('/health')).status).toBe(200);
        expect((await request(limitedApp).get('/health')).status).toBe(200);
    });
});

describe('POST /api/v1/auth/signup', () => {
    it('should create a user and return a token without leaking the password', async () => {
        store.findUserByUsername.mockResolvedValue(null);
        store.createUser.mockImplementation((user) => ({ ...user, id: USER_ID }));

        const res = await request(app)
            .post('/api/v1/auth/signup')
            .send({ username: 'testuser', password: 'password123' });

        expect(res.status).toBe(201);
        expect(res.body).toEqual({
            id: USER_ID,
            username: 'testuser',
            token: expect.any(String),
        });
        expect(res.body).not.toHaveProperty('password');
        expect(store.createUser).toHaveBeenCalledWith(
            expect.objectContaining({
                username: 'testuser',
                password: expect.not.stringMatching(/^password123$/),
            }),
        );
    });

    it('should return 409 when the username is taken', async () => {
        store.findUserByUsername.mockResolvedValue({ id: USER_ID, username: 'testuser' });

        const res = await request(app)
            .post('/api/v1/auth/signup')
            .send({ username: 'testuser', password: 'password123' });

        expect(res.status).toBe(409);
        expect(res.body).toEqual({ error: 'User already exists' });
        expect(store.createUser).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid credentials', async () => {
        const res = await request(app)
            .post('/api/v1/auth/signup')
            .send({ username: 'ab', password: 'x' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Username must be between 3 and 30 characters long');
        expect(store.findUserByUsername).not.toHaveBeenCalled();
    });
});

describe('POST /api/v1/auth/login', () => {
    it('should return a token for valid credentials', async () => {
        store.findUserByUsername.mockResolvedValue({
            id: USER_ID,
            username: 'testuser',
            password: await hashOf('password123'),
        });

        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ username: 'testuser', password: 'password123' });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            id: USER_ID,
            username: 'testuser',
            token: expect.any(String),
        });
    });

    it('should return 401 for a wrong password', async () => {
        store.findUserByUsername.mockResolvedValue({
            id: USER_ID,
            username: 'testuser',
            password: await hashOf('password123'),
        });

        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ username: 'testuser', password: 'wrongpassword' });

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: 'Invalid credentials' });
    });

    it('should return the same 401 for an unknown user so accounts cannot be probed', async () => {
        store.findUserByUsername.mockResolvedValue(null);

        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ username: 'ghost', password: 'password123' });

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: 'Invalid credentials' });
    });
});

describe('GET /api/v1/characters/random', () => {
    it('should return a random character', async () => {
        store.getRandomCharacter.mockResolvedValue(character);

        const res = await request(app).get('/api/v1/characters/random');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(character);
    });

    it('should fall back to the default monster when the table is empty', async () => {
        store.getRandomCharacter.mockResolvedValue(null);

        const res = await request(app).get('/api/v1/characters/random');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(DEFAULT_MONSTER);
    });
});

describe('GET /api/v1/characters', () => {
    it('should return the characters owned by the authenticated user', async () => {
        store.findCharactersByPlayer.mockResolvedValue([character]);

        const res = await request(app)
            .get('/api/v1/characters')
            .set(...authHeader());

        expect(res.status).toBe(200);
        expect(res.body).toEqual([character]);
        expect(store.findCharactersByPlayer).toHaveBeenCalledWith(USER_ID);
    });

    it('should return 401 without a token', async () => {
        const res = await request(app).get('/api/v1/characters');

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: 'Authentication token is required' });
    });

    it('should return 401 for an invalid token', async () => {
        const res = await request(app)
            .get('/api/v1/characters')
            .set('Authorization', 'Bearer not-a-jwt');

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: 'Invalid or expired token' });
    });
});

describe('POST /api/v1/characters', () => {
    it('should create a character and point to it with the Location header', async () => {
        store.createCharacter.mockImplementation((newCharacter) => newCharacter);

        const res = await request(app)
            .post('/api/v1/characters')
            .set(...authHeader())
            .send({ name: '  Conan  ', atk: 60, intelligence: 40, health: 250 });

        expect(res.status).toBe(201);
        expect(res.headers.location).toMatch(/^\/api\/v1\/characters\/[0-9a-f-]{36}$/);
        expect(res.body).toEqual({
            id: expect.any(String),
            name: 'Conan',
            atk: 60,
            intelligence: 40,
            health: 250,
            isMonster: false,
            img: 'hero.png',
            idPlayer: USER_ID,
        });
    });

    it('should return 400 for an invalid name', async () => {
        const res = await request(app)
            .post('/api/v1/characters')
            .set(...authHeader())
            .send({ name: 'X', atk: 60, intelligence: 40, health: 250 });

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Name must be between 2 and 30 characters' });
        expect(store.createCharacter).not.toHaveBeenCalled();
    });

    it('should return 400 for stats out of range', async () => {
        const res = await request(app)
            .post('/api/v1/characters')
            .set(...authHeader())
            .send({ name: 'Conan', atk: 999, intelligence: 40, health: 250 });

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'ATK must be a number between 0 and 100' });
    });

    it('should return 400 when stats are not numbers', async () => {
        const res = await request(app)
            .post('/api/v1/characters')
            .set(...authHeader())
            .send({ name: 'Conan', atk: 'strong', intelligence: 40, health: 250 });

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'ATK must be a number between 0 and 100' });
    });
});

describe('GET /api/v1/characters/:id', () => {
    it('should return the character', async () => {
        store.findCharacter.mockResolvedValue(character);

        const res = await request(app).get(`/api/v1/characters/${CHAR_ID}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual(character);
    });

    it('should return 404 when the character does not exist', async () => {
        store.findCharacter.mockResolvedValue(null);

        const res = await request(app).get(`/api/v1/characters/${CHAR_ID}`);

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: 'Character not found' });
    });

    it('should return 400 without querying the database when the id is malformed', async () => {
        const res = await request(app).get('/api/v1/characters/not a valid id!');

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/^Id must be 1 to 64 characters long/);
        expect(store.findCharacter).not.toHaveBeenCalled();
    });
});

describe('PATCH /api/v1/characters/:id', () => {
    it('should forward only the fields that were sent', async () => {
        store.findCharacter.mockResolvedValue(character);
        store.updateCharacter.mockResolvedValue({ ...character, atk: 75 });

        const res = await request(app)
            .patch(`/api/v1/characters/${CHAR_ID}`)
            .set(...authHeader())
            .send({ atk: 75 });

        expect(res.status).toBe(200);
        expect(store.updateCharacter).toHaveBeenCalledWith(CHAR_ID, { atk: 75 });
        expect(res.body).toEqual({ ...character, atk: 75 });
    });

    it('should not allow overwriting fields that are not editable', async () => {
        store.findCharacter.mockResolvedValue(character);
        store.updateCharacter.mockResolvedValue(character);

        await request(app)
            .patch(`/api/v1/characters/${CHAR_ID}`)
            .set(...authHeader())
            .send({ atk: 75, isMonster: true, idPlayer: OTHER_USER_ID, img: 'hacked.png' });

        expect(store.updateCharacter).toHaveBeenCalledWith(CHAR_ID, { atk: 75 });
    });

    it('should return 400 when the body has no updatable field', async () => {
        const res = await request(app)
            .patch(`/api/v1/characters/${CHAR_ID}`)
            .set(...authHeader())
            .send({ isMonster: true });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe(
            'At least one field must be provided (name, atk, intelligence, health)',
        );
        expect(store.findCharacter).not.toHaveBeenCalled();
    });

    it('should answer 404, not 403, when the character belongs to someone else', async () => {
        store.findCharacter.mockResolvedValue(character);

        const res = await request(app)
            .patch(`/api/v1/characters/${CHAR_ID}`)
            .set(...authHeader(OTHER_USER_ID))
            .send({ atk: 75 });

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: 'Character not found' });
        expect(store.updateCharacter).not.toHaveBeenCalled();
    });

    it('should ignore isMonster in the body', async () => {
        store.createCharacter.mockResolvedValue(character);

        const res = await request(app)
            .post('/api/v1/characters')
            .set(...authHeader())
            .send({ name: 'Conan', atk: 60, intelligence: 40, health: 250, isMonster: true });

        expect(res.status).toBe(201);
        expect(store.createCharacter).toHaveBeenCalledWith(
            expect.objectContaining({ isMonster: false }),
        );
    });
});

describe('DELETE /api/v1/characters/:id', () => {
    it('should delete the character and return 204 with no body', async () => {
        store.findCharacter.mockResolvedValue(character);
        store.deleteCharacter.mockResolvedValue(undefined);

        const res = await request(app)
            .delete(`/api/v1/characters/${CHAR_ID}`)
            .set(...authHeader());

        expect(res.status).toBe(204);
        expect(res.text).toBe('');
        expect(store.deleteCharacter).toHaveBeenCalledWith(CHAR_ID);
    });

    it('should answer 404, not 403, when the character belongs to someone else', async () => {
        store.findCharacter.mockResolvedValue(character);

        const res = await request(app)
            .delete(`/api/v1/characters/${CHAR_ID}`)
            .set(...authHeader(OTHER_USER_ID));

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: 'Character not found' });
        expect(store.deleteCharacter).not.toHaveBeenCalled();
    });

    it('should return 404 when the character does not exist', async () => {
        store.findCharacter.mockResolvedValue(null);

        const res = await request(app)
            .delete(`/api/v1/characters/${CHAR_ID}`)
            .set(...authHeader());

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: 'Character not found' });
    });
});

describe('error handling', () => {
    it('should return 404 in JSON for an unknown route', async () => {
        const res = await request(app).get('/nope');

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Route not found: GET /nope');
    });

    it('should return 404 for the old non-versioned routes', async () => {
        const res = await request(app).get('/getRandomChar');

        expect(res.status).toBe(404);
    });

    it('should return 400 for a malformed JSON body', async () => {
        const res = await request(app)
            .post('/api/v1/characters')
            .set(...authHeader())
            .set('Content-Type', 'application/json')
            .send('{"name": ');

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Malformed JSON in request body' });
    });

    it('should return 413 for a payload above the size limit', async () => {
        const res = await request(app)
            .post('/api/v1/characters')
            .set(...authHeader())
            .send({ name: 'a'.repeat(20000), atk: 1, intelligence: 1, health: 1 });

        expect(res.status).toBe(413);
        expect(res.body).toEqual({ error: 'Request body is too large' });
    });

    it('should return a generic 500 without leaking database details', async () => {
        store.findCharacter.mockRejectedValue(
            new Error('connection to postgres://user:secret@10.0.0.5:5432 failed'),
        );

        const res = await request(app).get(`/api/v1/characters/${CHAR_ID}`);

        expect(res.status).toBe(500);
        expect(res.body).toEqual({ error: 'An internal error occurred, please try again later' });
        expect(JSON.stringify(res.body)).not.toMatch(/postgres|secret|10\.0\.0\.5/);
    });
});

describe('framework assumptions', () => {
    it('should run on Express 5, which is what makes the error format work', () => {
        // Every route handler in this project is `async` and throws to report a
        // problem, instead of building a response with res.status().json(). The
        // rejected promise has to reach middleware/errorHandler.js for the
        // { "error": "..." } shape to exist at all.
        //
        // Express 5 forwards that rejection on its own. Express 4 does not: the
        // request would hang until it timed out, the error would never be logged,
        // and every failure in this API would come back as an empty 200-less
        // timeout. That is a silent break, not a loud one, hence this test.
        //
        // If it fails, the fix is either to stay on Express 5 or to wrap every
        // handler to forward errors by hand.
        const major = Number(require('express/package.json').version.split('.')[0]);

        expect(major).toBeGreaterThanOrEqual(5);
    });

    it('should report a rejected async handler through the error handler', async () => {
        // The same mechanism as above, proven through a real request: a plain
        // Error rejected inside the async route handler comes out as a 500.
        store.findCharacter.mockRejectedValue(new Error('database is down'));

        const res = await request(app).get(`/api/v1/characters/${CHAR_ID}`);

        expect(res.status).toBe(500);
        expect(res.body).toEqual({ error: 'An internal error occurred, please try again later' });
    });
});

// These guards run while config is being loaded, so they cannot be tested by
// importing it: by the time a test could inspect anything, a broken production
// configuration would already have thrown or, worse, loaded. Each case spawns a
// real node process with a controlled environment instead, which is also the
// only honest way to see what a deploy would do on boot.
const { execFileSync } = require('child_process');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'config', 'index.js');

const loadConfigWith = (env) => {
    const result = { stdout: '', failed: false, message: '' };

    try {
        result.stdout = execFileSync(
            process.execPath,
            ['-e', `require(${JSON.stringify(CONFIG_PATH)})`],
            {
                env: { PATH: process.env.PATH, ...env },
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'pipe'],
            },
        );
    } catch (error) {
        result.failed = true;
        result.message = `${error.stdout || ''}${error.stderr || ''}`;
    }

    return result;
};

const PRODUCTION_BASE = {
    NODE_ENV: 'production',
    JWT_SECRET: 'a-long-enough-secret-that-is-not-the-fallback',
    CORS_ORIGIN: 'https://game.example.com',
};

describe('production boot guards', () => {
    it('should load with a valid https origin', () => {
        const result = loadConfigWith(PRODUCTION_BASE);

        expect(result.failed).toBe(false);
    });

    it('should accept several comma-separated origins', () => {
        const result = loadConfigWith({
            ...PRODUCTION_BASE,
            CORS_ORIGIN: 'https://game.example.com, https://www.example.com',
        });

        expect(result.failed).toBe(false);
    });

    it('should refuse to start without CORS_ORIGIN', () => {
        const result = loadConfigWith({ ...PRODUCTION_BASE, CORS_ORIGIN: undefined });

        expect(result.failed).toBe(true);
        expect(result.message).toMatch(/CORS_ORIGIN/);
    });

    it('should refuse to start with a wildcard', () => {
        const result = loadConfigWith({ ...PRODUCTION_BASE, CORS_ORIGIN: '*' });

        expect(result.failed).toBe(true);
        expect(result.message).toMatch(/CORS_ORIGIN/);
    });

    it('should refuse to start with a subdomain pattern', () => {
        // The comparison against the browser Origin header is exact, so a
        // pattern would never match a single request. Failing is better than
        // shipping an API that quietly rejects its own frontend.
        const result = loadConfigWith({ ...PRODUCTION_BASE, CORS_ORIGIN: '*.example.com' });

        expect(result.failed).toBe(true);
        expect(result.message).toMatch(/CORS_ORIGIN/);
    });

    it('should refuse to start with a wildcard subdomain that is a valid URL', () => {
        // "https://*.example.com" parses fine, so only an explicit check for the
        // wildcard catches it before it ships as a frontend that never matches.
        const result = loadConfigWith({ ...PRODUCTION_BASE, CORS_ORIGIN: 'https://*.example.com' });

        expect(result.failed).toBe(true);
        expect(result.message).toMatch(/CORS_ORIGIN/);
    });

    it('should refuse to start with an origin that has a path', () => {
        const result = loadConfigWith({
            ...PRODUCTION_BASE,
            CORS_ORIGIN: 'https://game.example.com/app',
        });

        expect(result.failed).toBe(true);
        expect(result.message).toMatch(/CORS_ORIGIN/);
    });

    it('should refuse to start with a plain http origin', () => {
        const result = loadConfigWith({
            ...PRODUCTION_BASE,
            CORS_ORIGIN: 'http://game.example.com',
        });

        expect(result.failed).toBe(true);
        expect(result.message).toMatch(/https/);
    });

    it('should refuse to start with a fallback JWT secret', () => {
        const result = loadConfigWith({
            ...PRODUCTION_BASE,
            JWT_SECRET: 'super_secret_earth_fate_key_change_in_production',
        });

        expect(result.failed).toBe(true);
        expect(result.message).toMatch(/JWT_SECRET/);
    });
});

describe('development boot', () => {
    it('should start without CORS_ORIGIN, where the fallback is acceptable', () => {
        const result = loadConfigWith({ NODE_ENV: 'development', CORS_ORIGIN: undefined });

        expect(result.failed).toBe(false);
    });
});

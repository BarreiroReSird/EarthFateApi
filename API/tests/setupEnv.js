// Runs before the app is required, so the tests never read the developer's real
// .env and never sign anything with the real JWT_SECRET.
process.env.JWT_SECRET = 'test_only_secret_not_used_anywhere_else';
process.env.SUPABASE_URL = 'http://127.0.0.1:1';
process.env.SUPABASE_KEY = 'test_only_key';
process.env.NODE_ENV = 'test';

// The API tests make more auth calls than the real limit allows. The two limits
// differ on purpose, so a test can tell which one applies to a request.
process.env.RATE_LIMIT_GENERAL_MAX = '10000';
process.env.RATE_LIMIT_AUTH_MAX = '9000';

// No reverse proxy in front of the app under test
process.env.TRUST_PROXY = 'false';

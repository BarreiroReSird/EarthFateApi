module.exports = {
    testEnvironment: 'node',
    // The API tests make more auth calls than the real limit allows
    setupFiles: ['<rootDir>/API/tests/setupEnv.js'],
    collectCoverageFrom: ['API/**/*.js', '!API/**/*.test.js', '!API/tests/**'],
};

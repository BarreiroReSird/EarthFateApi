module.exports = {
    testEnvironment: 'node',
    // The API tests make more auth calls than the real limit allows
    setupFiles: ['<rootDir>/API/tests/setupEnv.js'],
    // The seed script only runs by hand against a real spreadsheet
    collectCoverageFrom: ['API/**/*.js', '!API/**/*.test.js', '!API/tests/**', '!API/scripts/**'],
};

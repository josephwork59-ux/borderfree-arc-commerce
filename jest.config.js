const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/', '<rootDir>/contracts-pkg/'],
  moduleNameMapper: {
    // ipfs-http-client ships ESM-only with no CJS entry point; Jest can't
    // resolve it directly, and we never want to hit the real network in tests.
    '^ipfs-http-client$': '<rootDir>/__mocks__/ipfs-http-client.js',
  },
};

module.exports = createJestConfig(config);

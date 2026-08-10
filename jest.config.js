const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

// .claude/ can contain a nested git worktree checkout of this same project
// (e.g. when working via Claude Code) - without excluding it, Jest's file
// crawler recurses into it and picks up a second copy of every test, mock,
// and package.json, causing haste-map naming collisions and attempts to run
// contracts-pkg's Hardhat/ESM tests under this (incompatible) jsdom config.
const ignorePatterns = ['<rootDir>/node_modules/', '<rootDir>/.next/', '<rootDir>/contracts-pkg/', '<rootDir>/.claude/'];

const config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ignorePatterns,
  modulePathIgnorePatterns: ignorePatterns,
  watchPathIgnorePatterns: ignorePatterns,
};

module.exports = createJestConfig(config);

const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig');

module.exports = {
  preset: 'ts-jest',
  rootDir: ".",
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
  ],
  testMatch: ["**/?(*.)+(spec|test).ts?(x)"],
  testTimeout: 50000,
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
};
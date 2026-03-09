import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

const config: Config = {
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/src/__tests__/setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/jest-setup.ts'],
  testMatch: ['<rootDir>/src/__tests__/**/*.test.{ts,tsx}'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^next-intl$': '<rootDir>/src/__tests__/mocks/next-intl.ts',
    '^next-intl/middleware$': '<rootDir>/src/__tests__/mocks/next-intl-middleware.ts',
    '^next-intl/server$': '<rootDir>/src/__tests__/mocks/next-intl.ts',
    '^next-intl/routing$': '<rootDir>/src/__tests__/mocks/next-intl-routing.ts',
    '^next-intl/navigation$': '<rootDir>/src/__tests__/mocks/next-intl-navigation.ts',
    '^@/i18n/navigation$': '<rootDir>/src/__tests__/mocks/next-intl-navigation.ts',
    '^@/i18n/routing$': '<rootDir>/src/__tests__/mocks/next-intl-routing.ts',
  },
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/layout.tsx',
    '!src/**/globals.css',
  ],
};

export default createJestConfig(config);

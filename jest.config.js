/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['./jest.setup.js'],
    transform: {
      '^.+\\.(ts|tsx|js|jsx)$': ['babel-jest', { configFile: './babel.config.jest.js' }],
    },
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/$1',
      '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
      '^@/components/(.*)$': '<rootDir>/components/$1',
      '^@/app/(.*)$': '<rootDir>/app/$1',
      '^@/lib/(.*)$': '<rootDir>/lib/$1',
      '^@/utils/(.*)$': '<rootDir>/utils/$1',
      '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
      '^@/contexts/(.*)$': '<rootDir>/contexts/$1',
      '^@/types/(.*)$': '<rootDir>/types/$1',
      '^@/styles/(.*)$': '<rootDir>/styles/$1',
      '^@/public/(.*)$': '<rootDir>/public/$1',
      '^@/tests/(.*)$': '<rootDir>/tests/$1'
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    testPathIgnorePatterns: ['/node_modules/', '/.next/', '/.million/'],
    collectCoverageFrom: [
      '**/*.{ts,tsx}',
      '!**/node_modules/**',
      '!**/.next/**',
      '!**/coverage/**',
      '!**/types/**',
      '!**/*.d.ts',
      '!**/jest.config.js',
      '!**/jest.setup.js',
      '!**/next.config.mjs',
      '!**/postcss.config.mjs',
      '!**/tailwind.config.ts'
    ],
    transformIgnorePatterns: [
      '/node_modules/(?!(@firebase|firebase|@babel/runtime)/)'
    ],
    testEnvironmentOptions: {
      url: 'http://localhost'
    }
  }
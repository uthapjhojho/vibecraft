/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          target: 'ES2022',
          module: 'CommonJS',
          moduleResolution: 'Node',
          esModuleInterop: true,
          resolveJsonModule: true,
          strict: true,
        },
      },
    ],
  },
  moduleNameMapper: {
    '^node:(.*)$': '$1',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  clearMocks: true,
}

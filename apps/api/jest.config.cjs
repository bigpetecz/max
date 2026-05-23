module.exports = {
  displayName: 'api-integration',
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '../..',
  testMatch: ['<rootDir>/apps/api/test/**/*.int.spec.ts'],
  modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/.nx/cache/'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/apps/api/tsconfig.app.json',
      },
    ],
  },
};

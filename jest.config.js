module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./tests/setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/app.js',
    '!src/config/database.js',
    '!src/config/redis.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 40,
      lines: 50,
      statements: 50
    }
  },
  verbose: true,
  testTimeout: 30000,
  forceExit: true,
  detectOpenHandles: true,
  moduleDirectories: ['node_modules', 'src'],
  roots: ['<rootDir>', '<rootDir>/tests'],
  moduleNameMapper: {
    '^../modules/user/models/(.*)$': '<rootDir>/tests/__mocks__/modelMock.js',
    '^../modules/catalog/models/(.*)$': '<rootDir>/tests/__mocks__/modelMock.js',
    '^../modules/booking/models/(.*)$': '<rootDir>/tests/__mocks__/modelMock.js',
    '^../modules/admin/models/(.*)$': '<rootDir>/tests/__mocks__/modelMock.js'
  }
};

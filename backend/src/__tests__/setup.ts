// Test setup file
// This file is run before each test file

// Increase timeout for async operations
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
beforeAll(() => {
  // You can mock console.log, console.error etc. if needed for cleaner test output
  // jest.spyOn(console, 'log').mockImplementation(() => {});
  // jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  // Restore console methods
  // jest.restoreAllMocks();
});

// Global test utilities can be added here
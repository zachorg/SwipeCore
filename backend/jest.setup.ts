import nock from 'nock';

// Block internet access in mock mode to ensure tests don't leak real HTTP calls
if (process.env.GOOGLE_API_MODE === 'mock') {
  nock.disableNetConnect();
}

// Test setup (moved from src/__tests__/setup.ts)
jest.setTimeout(10000);

beforeAll(() => {
  // Mock console methods if needed for cleaner test output
  // jest.spyOn(console, 'log').mockImplementation(() => {});
  // jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  // Restore console methods and clean up nock
  // jest.restoreAllMocks();
  if (process.env.GOOGLE_API_MODE === 'mock') {
    nock.cleanAll();
  }
});
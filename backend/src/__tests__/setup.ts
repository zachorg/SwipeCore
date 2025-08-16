// Test setup configuration
import { jest } from '@jest/globals';

// Mock crypto.randomUUID for consistent testing
Object.defineProperty(global, 'crypto', {
    value: {
        randomUUID: () => 'test-uuid-12345-67890-abcdef'
    }
});

// Mock console methods to reduce noise in tests
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

// Set test timeout
jest.setTimeout(10000);

// Global test utilities
(global as any).testUtils = {
    // Generate test phone numbers
    generateTestPhone: (index: number = 0) => `+1${5550000000 + index}`,

    // Generate test verification IDs
    generateTestVerificationId: (index: number = 0) => `test-verification-${index}`,

    // Generate test OTP codes
    generateTestOTP: (index: number = 0) => `${100000 + index}`,

    // Wait for async operations
    wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

    // Mock date for consistent testing
    mockDate: (date: string | Date) => {
        const mockDate = new Date(date);
        jest.useFakeTimers();
        jest.setSystemTime(mockDate);
        return () => jest.useRealTimers();
    }
};

// Cleanup after each test
afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
});

// Global teardown
afterAll(() => {
    jest.useRealTimers();
});

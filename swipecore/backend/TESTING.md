# Testing Guide for OTP and User Profile Services

This document explains how to run and maintain tests for the OTP verification and user profile management services.

## Test Structure

```
backend/src/__tests__/
├── setup.ts                 # Test configuration and global setup
├── otp.test.ts             # OTP service tests
├── userProfileService.test.ts # User profile service tests
└── integration.test.ts      # Integration tests between services
```

## Running Tests

### Prerequisites

Make sure you have the required dependencies installed:

```bash
npm install --save-dev jest @types/jest supertest @types/supertest
```

### Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- otp.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="should send OTP successfully"
```

### Test Configuration

The tests are configured in `jest.config.js` and use the setup file `src/__tests__/setup.ts` for global configuration.

## Test Categories

### 1. OTP Service Tests (`otp.test.ts`)

Tests the OTP verification endpoints:

- **POST /otp/send** - Sending OTP codes
- **POST /otp/verify** - Verifying OTP codes
- **POST /otp/check-verification** - Checking verification status
- **GET /otp/status** - Service health status
- **OTP Expiration Cleanup** - Automatic cleanup of expired codes

#### Key Test Scenarios:

- ✅ Successful OTP sending and verification
- ❌ Missing or invalid phone numbers
- ❌ Invalid or expired OTP codes
- ❌ SMS service failures
- 🔄 Automatic cleanup of expired OTPs

### 2. User Profile Service Tests (`userProfileService.test.ts`)

Tests the user profile management endpoints:

- **POST /userprofile/create** - Creating/updating user profiles
- **POST /userprofile/get-via-verification-id** - Retrieving profiles by verification ID
- **POST /userprofile/get-via-phone-number** - Retrieving profiles by phone number
- **GET /userprofile/health** - Service health check

#### Key Test Scenarios:

- ✅ Successful profile creation and retrieval
- ❌ Missing required fields (phone, verification_id, age, gender)
- ❌ Database connection errors
- 🔍 Input validation edge cases
- 📊 Health monitoring

### 3. Integration Tests (`integration.test.ts`)

Tests the complete user registration flow:

- **Complete User Registration Flow** - End-to-end OTP → verification → profile creation
- **User Profile Retrieval After Verification** - Profile access using verification IDs
- **Error Handling in Integration Flow** - Graceful failure handling
- **Data Consistency Between Services** - Phone number and verification ID consistency
- **Service Health and Monitoring** - Overall system health

## Mocking Strategy

### External Dependencies

The tests mock external dependencies to ensure isolated testing:

```typescript
// Mock SMS service
jest.mock('../services/smsService');

// Mock Supabase database
jest.mock('../lib/supabase', () => ({
  supabase: {
    /* mock implementation */
  },
  userProfileApi: {
    /* mock implementation */
  },
}));
```

### In-Memory Storage

OTP tests use the actual in-memory store to test real behavior:

```typescript
// Access the actual OTP store for testing
const otpStore = (otpRouter as any).otpStore;
const storedOtp = otpStore.get(phoneNumber);
```

## Test Data Management

### Test Utilities

Global test utilities are available in `setup.ts`:

```typescript
// Generate test phone numbers
const phone = global.testUtils.generateTestPhone(0); // +15550000000

// Generate test verification IDs
const verificationId = global.testUtils.generateTestVerificationId(0);

// Generate test OTP codes
const otp = global.testUtils.generateTestOTP(0); // 100000

// Mock dates for consistent testing
const cleanup = global.testUtils.mockDate('2024-01-01T00:00:00Z');
// ... test code ...
cleanup(); // Restore real timers
```

### Test Data Cleanup

Tests automatically clean up after themselves:

```typescript
beforeEach(() => {
  jest.clearAllMocks();
  (otpRouter as any).otpStore?.clear();
});

afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});
```

## Writing New Tests

### Test Structure

Follow this pattern for new tests:

```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup test data and mocks
  });

  it('should do something successfully', async () => {
    // Arrange
    const testData = {
      /* test data */
    };

    // Act
    const response = await request(app).post('/endpoint').send(testData);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('should handle errors gracefully', async () => {
    // Test error scenarios
  });
});
```

### Mocking Guidelines

1. **Mock external services** (SMS, database)
2. **Use real business logic** when possible
3. **Test edge cases** and error conditions
4. **Verify mock calls** to ensure correct interaction

### Assertion Patterns

```typescript
// HTTP status codes
expect(response.status).toBe(200);

// Response body structure
expect(response.body.success).toBe(true);
expect(response.body.message).toBe('Expected message');

// Mock function calls
expect(mockFunction).toHaveBeenCalledWith(expectedArgs);
expect(mockFunction).toHaveBeenCalledTimes(1);

// Data consistency
expect(profile.phone_number).toBe(phoneNumber);
expect(profile.verification_id).toBe(verificationId);
```

## Debugging Tests

### Verbose Output

```bash
# Run tests with detailed output
npm test -- --verbose

# Run specific test with console output
npm test -- --testNamePattern="should send OTP successfully" --verbose
```

### Debug Mode

```bash
# Run tests in debug mode
npm test -- --detectOpenHandles --forceExit
```

### Test Isolation

If tests are interfering with each other:

```typescript
// Use unique identifiers for each test
const phoneNumber = `+1${5550000000 + Math.floor(Math.random() * 1000)}`;
const verificationId = `test-${Date.now()}-${Math.random()}`;
```

## Coverage Goals

Aim for high test coverage:

- **Statements**: >90%
- **Branches**: >85%
- **Functions**: >90%
- **Lines**: >90%

## Continuous Integration

Tests should run automatically in CI/CD:

```yaml
# Example GitHub Actions
- name: Run Tests
  run: npm test
  env:
    NODE_ENV: test
```

## Troubleshooting

### Common Issues

1. **Mock not working**: Ensure mocks are imported before the module under test
2. **Async test failures**: Use proper async/await and increase timeout if needed
3. **Database connection errors**: Verify Supabase mocks are working correctly
4. **Test isolation**: Check for shared state between tests

### Performance

- Tests should complete in <10 seconds
- Use `jest.setTimeout(10000)` for long-running operations
- Mock heavy operations (database queries, external API calls)

## Best Practices

1. **Test the happy path first** - ensure basic functionality works
2. **Test error conditions** - verify graceful failure handling
3. **Use descriptive test names** - make failures easy to understand
4. **Keep tests independent** - avoid test interdependencies
5. **Mock external dependencies** - ensure tests are fast and reliable
6. **Test edge cases** - validate input validation and boundary conditions
7. **Verify data consistency** - ensure related data stays synchronized

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Express Testing Guide](https://expressjs.com/en/advanced/best-practices-performance.html#testing)

// Jest setup for NomNom Backend

// Set test environment to development by default
process.env.NODE_ENV = 'test';

// Ensure dev cache is disabled during tests to prevent file system conflicts
process.env.USE_DEV_CACHE = 'false';
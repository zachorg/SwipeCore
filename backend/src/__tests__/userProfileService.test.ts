import request from 'supertest';
import express from 'express';
import { userProfileRouter } from '../routes/userProfileRouter';

// Mock Supabase
jest.mock('../lib/supabase', () => ({
    supabase: {
        from: jest.fn(() => ({
            select: jest.fn(() => ({
                eq: jest.fn(() => ({
                    single: jest.fn(() => ({ data: null, error: null }))
                }))
            }))
        })),
        userProfileApi: {
            upsertProfile: jest.fn(() => ({ error: null }))
        }
    }
}));

const app = express();
app.use(express.json());
app.use('/userprofile', userProfileRouter);

describe('User Profile Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /userprofile/create', () => {
        const validProfileData = {
            phone_number: '+1234567890',
            verification_id: 'uuid-123',
            age: '25',
            gender: 'male'
        };

        it('should create user profile successfully', async () => {
            const mockUserProfileApi = require('../lib/supabase').userProfileApi;
            mockUserProfileApi.upsertProfile = jest.fn().mockResolvedValue({
                error: null
            });

            const response = await request(app)
                .post('/userprofile/create')
                .send(validProfileData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User profile created successfully');
            expect(mockUserProfileApi.upsertProfile).toHaveBeenCalledWith(validProfileData);
        });

        it('should return 400 when phone_number is missing', async () => {
            const { phone_number, ...incompleteData } = validProfileData;

            const response = await request(app)
                .post('/userprofile/create')
                .send(incompleteData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Phone number, verification ID, age, and gender are required');
        });

        it('should return 400 when verification_id is missing', async () => {
            const { verification_id, ...incompleteData } = validProfileData;

            const response = await request(app)
                .post('/userprofile/create')
                .send(incompleteData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Phone number, verification ID, age, and gender are required');
        });

        it('should return 400 when age is missing', async () => {
            const { age, ...incompleteData } = validProfileData;

            const response = await request(app)
                .post('/userprofile/create')
                .send(incompleteData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Phone number, verification ID, age, and gender are required');
        });

        it('should return 400 when gender is missing', async () => {
            const { gender, ...incompleteData } = validProfileData;

            const response = await request(app)
                .post('/userprofile/create')
                .send(incompleteData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Phone number, verification ID, age, and gender are required');
        });

        it('should handle upsertProfile errors gracefully', async () => {
            const mockUserProfileApi = require('../lib/supabase').userProfileApi;
            mockUserProfileApi.upsertProfile = jest.fn().mockResolvedValue({
                error: { message: 'Database connection failed' }
            });

            const response = await request(app)
                .post('/userprofile/create')
                .send(validProfileData)
                .expect(500);

            expect(response.body.success).toBe(false);
            expect(response.body.errorCode).toBe('PROFILE_OPERATION_FAILED');
            expect(response.body.message).toBe('Failed to manage user profile');
        });

        it('should handle empty string values as missing', async () => {
            const invalidData = {
                phone_number: '',
                verification_id: 'uuid-123',
                age: '25',
                gender: 'male'
            };

            const response = await request(app)
                .post('/userprofile/create')
                .send(invalidData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Phone number, verification ID, age, and gender are required');
        });
    });

    describe('POST /userprofile/get-via-verification-id', () => {
        it('should return user profile when verification_id exists', async () => {
            const mockUserProfile = {
                id: 'profile-uuid',
                verification_id: 'uuid-123',
                phone_number: '+1234567890',
                age: '25',
                gender: 'male',
                created_at: '2024-01-01T00:00:00Z'
            };

            const mockSupabase = require('../lib/supabase').supabase;
            mockSupabase.from.mockReturnValue({
                select: jest.fn(() => ({
                    eq: jest.fn(() => ({
                        single: jest.fn(() => ({
                            data: mockUserProfile,
                            error: null
                        }))
                    }))
                }))
            });

            const response = await request(app)
                .post('/userprofile/get-via-verification-id')
                .send({ verification_id: 'uuid-123' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.userProfile).toEqual(mockUserProfile);
        });

        it('should return 400 when verification_id is missing', async () => {
            const response = await request(app)
                .post('/userprofile/get-via-verification-id')
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Verification ID is required');
        });

        it('should return 400 when verification_id is empty', async () => {
            const response = await request(app)
                .post('/userprofile/get-via-verification-id')
                .send({ verification_id: '' })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Verification ID is required');
        });

        it('should handle database errors gracefully', async () => {
            const mockSupabase = require('../lib/supabase').supabase;
            mockSupabase.from.mockReturnValue({
                select: jest.fn(() => ({
                    eq: jest.fn(() => ({
                        single: jest.fn(() => ({
                            data: null,
                            error: { message: 'Database connection failed' }
                        }))
                    }))
                }))
            });

            const response = await request(app)
                .post('/userprofile/get-via-verification-id')
                .send({ verification_id: 'uuid-123' })
                .expect(500);

            expect(response.body.success).toBe(false);
            expect(response.body.errorCode).toBe('PROFILE_OPERATION_FAILED');
        });
    });

    describe('POST /userprofile/get-via-phone-number', () => {
        it('should return user profile when phone_number exists', async () => {
            const mockUserProfile = {
                id: 'profile-uuid',
                verification_id: 'uuid-123',
                phone_number: '+1234567890',
                age: '25',
                gender: 'male',
                created_at: '2024-01-01T00:00:00Z'
            };

            const mockSupabase = require('../lib/supabase').supabase;
            mockSupabase.from.mockReturnValue({
                select: jest.fn(() => ({
                    eq: jest.fn(() => ({
                        single: jest.fn(() => ({
                            data: mockUserProfile,
                            error: null
                        }))
                    }))
                }))
            });

            const response = await request(app)
                .post('/userprofile/get-via-phone-number')
                .send({ phone_number: '+1234567890' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.user_profile).toEqual(mockUserProfile);
        });

        it('should return 400 when phone_number is missing', async () => {
            const response = await request(app)
                .post('/userprofile/get-via-phone-number')
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Phone number is required');
        });

        it('should return 400 when phone_number is empty', async () => {
            const response = await request(app)
                .post('/userprofile/get-via-phone-number')
                .send({ phone_number: '' })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Phone number is required');
        });

        it('should handle database errors gracefully', async () => {
            const mockSupabase = require('../lib/supabase').supabase;
            mockSupabase.from.mockReturnValue({
                select: jest.fn(() => ({
                    eq: jest.fn(() => ({
                        single: jest.fn(() => ({
                            data: null,
                            error: { message: 'Database connection failed' }
                        }))
                    }))
                }))
            });

            const response = await request(app)
                .post('/userprofile/get-via-phone-number')
                .send({ phone_number: '+1234567890' })
                .expect(500);

            expect(response.body.success).toBe(false);
            expect(response.body.errorCode).toBe('PROFILE_OPERATION_FAILED');
        });

        it('should log phone number when fetching profile', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const mockSupabase = require('../lib/supabase').supabase;
            mockSupabase.from.mockReturnValue({
                select: jest.fn(() => ({
                    eq: jest.fn(() => ({
                        single: jest.fn(() => ({
                            data: null,
                            error: null
                        }))
                    }))
                }))
            });

            await request(app)
                .post('/userprofile/get-via-phone-number')
                .send({ phone_number: '+1234567890' });

            expect(consoleSpy).toHaveBeenCalledWith('Getting user profile via phone number:', '+1234567890');
            consoleSpy.mockRestore();
        });
    });

    describe('GET /userprofile/health', () => {
        it('should return healthy status when database is connected', async () => {
            const mockSupabase = require('../lib/supabase').supabase;
            mockSupabase.from.mockReturnValue({
                select: jest.fn(() => ({
                    limit: jest.fn(() => ({
                        data: [{ count: 1 }],
                        error: null
                    }))
                }))
            });

            const response = await request(app)
                .get('/userprofile/health')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User Profile Service is healthy');
            expect(response.body.database.connected).toBe(true);
            expect(response.body.timestamp).toBeDefined();
        });

        it('should return unhealthy status when database has errors', async () => {
            const mockSupabase = require('../lib/supabase').supabase;
            mockSupabase.from.mockReturnValue({
                select: jest.fn(() => ({
                    limit: jest.fn(() => ({
                        data: null,
                        error: { message: 'Connection timeout' }
                    }))
                }))
            });

            const response = await request(app)
                .get('/userprofile/health')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.database.connected).toBe(false);
            expect(response.body.database.error).toBe('Connection timeout');
        });

        it('should handle unexpected errors gracefully', async () => {
            const mockSupabase = require('../lib/supabase').supabase;
            mockSupabase.from.mockImplementation(() => {
                throw new Error('Unexpected database error');
            });

            const response = await request(app)
                .get('/userprofile/health')
                .expect(500);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Health check failed');
        });
    });

    describe('Input Validation Edge Cases', () => {
        it('should handle null values in required fields', async () => {
            const invalidData = {
                phone_number: null,
                verification_id: 'uuid-123',
                age: '25',
                gender: 'male'
            };

            const response = await request(app)
                .post('/userprofile/create')
                .send(invalidData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should handle undefined values in required fields', async () => {
            const invalidData = {
                phone_number: undefined,
                verification_id: 'uuid-123',
                age: '25',
                gender: 'male'
            };

            const response = await request(app)
                .post('/userprofile/create')
                .send(invalidData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should handle whitespace-only values', async () => {
            const invalidData = {
                phone_number: '   ',
                verification_id: 'uuid-123',
                age: '25',
                gender: 'male'
            };

            const response = await request(app)
                .post('/userprofile/create')
                .send(invalidData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });
});

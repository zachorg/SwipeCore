import request from 'supertest';
import express from 'express';
import { otpRouter } from '../routes/otpRouter';
import { userProfileRouter } from '../routes/userProfileRouter';

// Mock dependencies
jest.mock('../services/smsService');
jest.mock('../lib/supabase', () => ({
    supabase: {
        from: jest.fn(() => ({
            upsert: jest.fn(() => ({
                select: jest.fn(() => ({
                    single: jest.fn(() => ({ error: null }))
                }))
            })),
            update: jest.fn(() => ({
                eq: jest.fn(() => ({
                    single: jest.fn(() => ({ error: null }))
                }))
            })),
            select: jest.fn(() => ({
                eq: jest.fn(() => ({
                    single: jest.fn(() => ({ data: null, error: null }))
                }))
            })),
            delete: jest.fn(() => ({
                eq: jest.fn(() => ({ error: null }))
            }))
        })),
        userProfileApi: {
            upsertProfile: jest.fn(() => ({ error: null }))
        }
    }
}));

const app = express();
app.use(express.json());
app.use('/otp', otpRouter);
app.use('/userprofile', userProfileRouter);

describe('OTP and User Profile Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Clear the in-memory OTP store
        (otpRouter as any).otpStore?.clear();
    });

    describe('Complete User Registration Flow', () => {
        it('should complete full user registration flow successfully', async () => {
            const phoneNumber = '+1234567890';
            const mockSmsService = require('../services/smsService');
            mockSmsService.sendOtp = jest.fn().mockResolvedValue({
                success: true,
                messageId: 'test_message_123'
            });

            // Step 1: Send OTP
            const sendResponse = await request(app)
                .post('/otp/send')
                .send({ phone: phoneNumber })
                .expect(200);

            expect(sendResponse.body.success).toBe(true);

            // Step 2: Get OTP from store (simulating SMS delivery)
            const otpStore = (otpRouter as any).otpStore;
            const storedOtp = otpStore.get(phoneNumber);
            expect(storedOtp).toBeDefined();
            expect(storedOtp.otp).toMatch(/^\d{6}$/);

            // Step 3: Verify OTP
            const verifyResponse = await request(app)
                .post('/otp/verify')
                .send({
                    phone: phoneNumber,
                    code: storedOtp.otp
                })
                .expect(200);

            expect(verifyResponse.body.success).toBe(true);
            expect(verifyResponse.body.verificationId).toBeDefined();
            expect(verifyResponse.body.token).toBeDefined();

            // Step 4: Create user profile
            const profileData = {
                phone_number: phoneNumber,
                verification_id: verifyResponse.body.verificationId,
                age: '25',
                gender: 'male'
            };

            const profileResponse = await request(app)
                .post('/userprofile/create')
                .send(profileData)
                .expect(200);

            expect(profileResponse.body.success).toBe(true);

            // Step 5: Verify profile was created
            const getProfileResponse = await request(app)
                .post('/userprofile/get-via-phone-number')
                .send({ phone_number: phoneNumber })
                .expect(200);

            expect(getProfileResponse.body.success).toBe(true);
        });

        it('should handle OTP expiration during registration flow', async () => {
            const phoneNumber = '+1987654321';
            const mockSmsService = require('../services/smsService');
            mockSmsService.sendOtp = jest.fn().mockResolvedValue({
                success: true,
                messageId: 'test_message_123'
            });

            // Step 1: Send OTP
            await request(app)
                .post('/otp/send')
                .send({ phone: phoneNumber })
                .expect(200);

            // Step 2: Manually expire the OTP
            const otpStore = (otpRouter as any).otpStore;
            const storedOtp = otpStore.get(phoneNumber);
            storedOtp.expiresAt = Date.now() - 1000; // Expired 1 second ago

            // Step 3: Try to verify expired OTP
            const verifyResponse = await request(app)
                .post('/otp/verify')
                .send({
                    phone: phoneNumber,
                    code: storedOtp.otp
                })
                .expect(400);

            expect(verifyResponse.body.errorCode).toBe('OTP_EXPIRED');

            // Step 4: Verify profile creation fails without valid verification
            const profileData = {
                phone_number: phoneNumber,
                verification_id: 'expired-uuid',
                age: '30',
                gender: 'female'
            };

            const profileResponse = await request(app)
                .post('/userprofile/create')
                .send(profileData)
                .expect(500);

            expect(profileResponse.body.success).toBe(false);
        });
    });

    describe('User Profile Retrieval After Verification', () => {
        it('should retrieve user profile using verification ID after OTP verification', async () => {
            const phoneNumber = '+1555123456';
            const mockSmsService = require('../services/smsService');
            mockSmsService.sendOtp = jest.fn().mockResolvedValue({
                success: true,
                messageId: 'test_message_123'
            });

            // Complete OTP flow
            await request(app)
                .post('/otp/send')
                .send({ phone: phoneNumber })
                .expect(200);

            const otpStore = (otpRouter as any).otpStore;
            const storedOtp = otpStore.get(phoneNumber);

            const verifyResponse = await request(app)
                .post('/otp/verify')
                .send({
                    phone: phoneNumber,
                    code: storedOtp.otp
                })
                .expect(200);

            const verificationId = verifyResponse.body.verificationId;

            // Create profile
            const profileData = {
                phone_number: phoneNumber,
                verification_id: verificationId,
                age: '28',
                gender: 'prefer-not-to-say'
            };

            await request(app)
                .post('/userprofile/create')
                .send(profileData)
                .expect(200);

            // Retrieve profile using verification ID
            const getProfileResponse = await request(app)
                .post('/userprofile/get-via-verification-id')
                .send({ verification_id: verificationId })
                .expect(200);

            expect(getProfileResponse.body.success).toBe(true);
            expect(getProfileResponse.body.userProfile.verification_id).toBe(verificationId);
            expect(getProfileResponse.body.userProfile.phone_number).toBe(phoneNumber);
        });
    });

    describe('Error Handling in Integration Flow', () => {
        it('should handle database errors during profile creation after successful OTP verification', async () => {
            const phoneNumber = '+1777888999';
            const mockSmsService = require('../services/smsService');
            mockSmsService.sendOtp = jest.fn().mockResolvedValue({
                success: true,
                messageId: 'test_message_123'
            });

            // Complete OTP flow successfully
            await request(app)
                .post('/otp/send')
                .send({ phone: phoneNumber })
                .expect(200);

            const otpStore = (otpRouter as any).otpStore;
            const storedOtp = otpStore.get(phoneNumber);

            const verifyResponse = await request(app)
                .post('/otp/verify')
                .send({
                    phone: phoneNumber,
                    code: storedOtp.otp
                })
                .expect(200);

            // Mock database error for profile creation
            const mockUserProfileApi = require('../lib/supabase').userProfileApi;
            mockUserProfileApi.upsertProfile = jest.fn().mockResolvedValue({
                error: { message: 'Database connection failed' }
            });

            // Profile creation should fail
            const profileResponse = await request(app)
                .post('/userprofile/create')
                .send({
                    phone_number: phoneNumber,
                    verification_id: verifyResponse.body.verificationId,
                    age: '35',
                    gender: 'female'
                })
                .expect(500);

            expect(profileResponse.body.success).toBe(false);
            expect(profileResponse.body.errorCode).toBe('PROFILE_OPERATION_FAILED');
        });

        it('should handle invalid verification ID when retrieving profile', async () => {
            // Try to get profile with non-existent verification ID
            const getProfileResponse = await request(app)
                .post('/userprofile/get-via-verification-id')
                .send({ verification_id: 'non-existent-uuid' })
                .expect(500);

            expect(getProfileResponse.body.success).toBe(false);
        });
    });

    describe('Data Consistency Between Services', () => {
        it('should maintain consistent phone number across OTP and profile services', async () => {
            const phoneNumber = '+1444555666';
            const mockSmsService = require('../services/smsService');
            mockSmsService.sendOtp = jest.fn().mockResolvedValue({
                success: true,
                messageId: 'test_message_123'
            });

            // Send OTP
            await request(app)
                .post('/otp/send')
                .send({ phone: phoneNumber })
                .expect(200);

            // Verify OTP
            const otpStore = (otpRouter as any).otpStore;
            const storedOtp = otpStore.get(phoneNumber);

            const verifyResponse = await request(app)
                .post('/otp/verify')
                .send({
                    phone: phoneNumber,
                    code: storedOtp.otp
                })
                .expect(200);

            // Create profile with same phone number
            const profileData = {
                phone_number: phoneNumber,
                verification_id: verifyResponse.body.verificationId,
                age: '22',
                gender: 'male'
            };

            await request(app)
                .post('/userprofile/create')
                .send(profileData)
                .expect(200);

            // Verify phone number consistency
            const profileByPhone = await request(app)
                .post('/userprofile/get-via-phone-number')
                .send({ phone_number: phoneNumber })
                .expect(200);

            const profileByVerification = await request(app)
                .post('/userprofile/get-via-verification-id')
                .send({ verification_id: verifyResponse.body.verificationId })
                .expect(200);

            expect(profileByPhone.body.user_profile.phone_number).toBe(phoneNumber);
            expect(profileByVerification.body.userProfile.phone_number).toBe(phoneNumber);
            expect(profileByPhone.body.user_profile.verification_id).toBe(verifyResponse.body.verificationId);
            expect(profileByVerification.body.userProfile.verification_id).toBe(verifyResponse.body.verificationId);
        });
    });

    describe('Service Health and Monitoring', () => {
        it('should provide health status for both services', async () => {
            // Check OTP service status
            const otpStatusResponse = await request(app)
                .get('/otp/status')
                .expect(200);

            expect(otpStatusResponse.body.success).toBe(true);
            expect(otpStatusResponse.body.status).toBeDefined();

            // Check user profile service health
            const profileHealthResponse = await request(app)
                .get('/userprofile/health')
                .expect(200);

            expect(profileHealthResponse.body.success).toBe(true);
            expect(profileHealthResponse.body.message).toBe('User Profile Service is healthy');
        });
    });
});

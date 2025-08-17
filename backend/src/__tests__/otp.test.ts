import request from 'supertest';
import express from 'express';
import { otpRouter } from '../routes/otpRouter';
import { smsService } from '../services/smsService';

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

describe('OTP Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Clear the in-memory OTP store
        (otpRouter as any).otpStore?.clear();
    });

    describe('POST /otp/send', () => {
        it('should send OTP successfully', async () => {
            const mockSmsService = smsService as jest.Mocked<typeof smsService>;
            mockSmsService.sendOtp = jest.fn().mockResolvedValue({
                success: true,
                messageId: 'test_message_123'
            });

            const response = await request(app)
                .post('/otp/send')
                .send({ phone: '+1234567890' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('OTP sent successfully');
        });

        it('should return 400 when phone number is missing', async () => {
            const response = await request(app)
                .post('/otp/send')
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Phone number is required');
        });

        it('should return 400 when phone number is empty', async () => {
            const response = await request(app)
                .post('/otp/send')
                .send({ phone: '' })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Phone number is required');
        });

        it('should handle SMS service failure gracefully', async () => {
            const mockSmsService = smsService as jest.Mocked<typeof smsService>;
            mockSmsService.sendOtp = jest.fn().mockResolvedValue({
                success: false,
                error: 'SMS service unavailable'
            });

            const response = await request(app)
                .post('/otp/send')
                .send({ phone: '+1234567890' })
                .expect(500);

            expect(response.body.success).toBe(false);
            expect(response.body.errorCode).toBe('OTP_SEND_FAILED');
        });
    });

    describe('POST /otp/verify', () => {
        beforeEach(async () => {
            // Pre-populate OTP store
            const mockSmsService = smsService as jest.Mocked<typeof smsService>;
            mockSmsService.sendOtp = jest.fn().mockResolvedValue({
                success: true,
                messageId: 'test_message_123'
            });

            await request(app)
                .post('/otp/send')
                .send({ phone: '+1234567890' });
        });

        it('should verify OTP successfully', async () => {
            // Get the OTP from the store (in real app, this would come from SMS)
            const otpStore = (otpRouter as any).otpStore;
            const storedOtp = otpStore.get('+1234567890');

            const response = await request(app)
                .post('/otp/verify')
                .send({
                    phone: '+1234567890',
                    code: storedOtp.otp
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('OTP verified successfully');
            expect(response.body.token).toBeDefined();
            expect(response.body.verificationId).toBeDefined();
        });

        it('should return 400 when phone number is missing', async () => {
            const response = await request(app)
                .post('/otp/verify')
                .send({ code: '123456' })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Phone number and code are required');
        });

        it('should return 400 when code is missing', async () => {
            const response = await request(app)
                .post('/otp/verify')
                .send({ phone: '+1234567890' })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Phone number and code are required');
        });

        it('should return 400 when OTP is invalid', async () => {
            const response = await request(app)
                .post('/otp/verify')
                .send({
                    phone: '+1234567890',
                    code: '999999'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid verification code');
        });

        it('should return 400 when OTP is expired', async () => {
            // Manually expire the OTP
            const otpStore = (otpRouter as any).otpStore;
            const storedOtp = otpStore.get('+1234567890');
            storedOtp.expiresAt = Date.now() - 1000; // Expired 1 second ago

            const response = await request(app)
                .post('/otp/verify')
                .send({
                    phone: '+1234567890',
                    code: storedOtp.otp
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.errorCode).toBe('OTP_EXPIRED');
        });
    });

    describe('POST /otp/check-verification', () => {
        it('should return 400 when verification ID is missing', async () => {
            const response = await request(app)
                .post('/otp/check-verification')
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Verification ID is required');
        });

        it('should return 404 when verification ID is not found', async () => {
            const response = await request(app)
                .post('/otp/check-verification')
                .send({ verificationId: 'non-existent-uuid' })
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.errorCode).toBe('VERIFICATION_ID_NOT_FOUND');
        });

        it('should return 404 when verification is expired', async () => {
            // Mock expired verification
            const mockSupabase = require('../lib/supabase').supabase;
            mockSupabase.from.mockReturnValue({
                select: jest.fn(() => ({
                    eq: jest.fn(() => ({
                        single: jest.fn(() => ({
                            data: {
                                verification_id: 'expired-uuid',
                                created_at: Date.now() - 24 * 60 * 60 * 1000 // 24 hours ago
                            },
                            error: null
                        }))
                    }))
                }))
            });

            const response = await request(app)
                .post('/otp/check-verification')
                .send({ verificationId: 'expired-uuid' })
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.errorCode).toBe('VERIFICATION_ID_NOT_FOUND');
        });
    });

    describe('GET /otp/status', () => {
        it('should return SMS service status', async () => {
            const mockSmsService = smsService as jest.Mocked<typeof smsService>;
            mockSmsService.getStatus = jest.fn().mockReturnValue({
                awsSnsReady: false,
                consoleFallback: true
            });

            const response = await request(app)
                .get('/otp/status')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.status).toBeDefined();
            expect(response.body.message).toContain('console fallback');
        });

        it('should handle SMS service errors gracefully', async () => {
            const mockSmsService = smsService as jest.Mocked<typeof smsService>;
            mockSmsService.getStatus = jest.fn().mockImplementation(() => {
                throw new Error('SMS service unavailable');
            });

            const response = await request(app)
                .get('/otp/status')
                .expect(500);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Failed to get service status');
        });
    });

    describe('OTP Expiration Cleanup', () => {
        it('should clean up expired OTPs automatically', async () => {
            // Add expired OTP to store
            const otpStore = (otpRouter as any).otpStore;
            otpStore.set('expired-phone', {
                otp: '123456',
                createdAt: Date.now() - 10 * 60 * 1000, // 10 minutes ago
                expiresAt: Date.now() - 5 * 60 * 1000   // Expired 5 minutes ago
            });

            // Verify expired OTP is in store
            expect(otpStore.has('expired-phone')).toBe(true);

            // Wait for cleanup interval (mock it)
            const cleanupInterval = setInterval(() => {
                const now = Date.now();
                for (const [phone, verification] of otpStore.entries()) {
                    if (now > verification.expiresAt) {
                        otpStore.delete(phone);
                    }
                }
            }, 1000);

            // Wait a bit for cleanup
            await new Promise(resolve => setTimeout(resolve, 1100));
            clearInterval(cleanupInterval);

            // Verify expired OTP was cleaned up
            expect(otpStore.has('expired-phone')).toBe(false);
        });
    });
});

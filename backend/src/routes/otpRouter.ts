import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { smsService } from '../services/smsService';
import { IsEmptyRowError, supabase } from '../lib/supabase';
import { userProfileService } from '../services/userProfileService';

const router = Router();

// In-memory storage for demo (use database in production)
const otpStore = new Map();

// Generate random 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP endpoint
router.post(
    '/send',
    asyncHandler(async (req: Request, res: Response) => {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required',
            });
        }

        try {
            // Generate OTP
            const otp = generateOTP();

            // Send OTP via SMS service (this actually sends the message)
            //const smsResult = await smsService.sendOtp(phone, otp);

            //if (smsResult.success) {
            console.log(
                `✅ OTP ${otp} sent to ${phone}` // via ${smsResult.messageId}
            );

            otpStore.set(phone, {
                otp,
                createdAt: Date.now(),
                expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
            });

            res.json({
                success: true,
                message: 'OTP sent successfully',
                // smsProvider: smsResult.messageId?.split('_')[0] || 'console',
            });
            // } else {
            //     throw new Error(`SMS delivery failed: ${smsResult.error}`);
            // }
        } catch (error) {
            console.error('Error sending OTP:', error);
            res.status(500).json({
                success: false,
                errorCode: 'OTP_SEND_FAILED',
                message: 'Failed to send OTP',
            });
        }
    })
);

// Verify OTP endpoint
router.post(
    '/verify',
    asyncHandler(async (req: Request, res: Response) => {
        const { phone, code } = req.body;

        if (!phone || !code) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and code are required',
            });
        }

        try {
            // Find stored OTP
            const foundVerification = otpStore.get(phone) as {
                otp: string;
                createdAt: number;
                expiresAt: number; // 5 minutes
            };

            if (!foundVerification) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid verification code',
                });
            }

            // Check if expired
            if (Date.now() > foundVerification.expiresAt) {
                // Clean up expired OTP
                otpStore.delete(phone);
                return res.status(400).json({
                    success: false,
                    errorCode: 'OTP_EXPIRED',
                    message: 'Verification code expired',
                });
            }

            // Create or update user
            const verificationId = crypto.randomUUID();

            const { error: upsertError_lookup } = await supabase
                .from('user_verification_lookups')
                .upsert(
                    {
                        verification_id: verificationId,
                        phone_number: phone,
                    },
                    {
                        onConflict: 'phone_number',
                    }
                )
                .select()
                .single();

            if (upsertError_lookup) {
                console.error(
                    'Error creating user verification lookup:',
                    upsertError_lookup
                );
                throw new Error('Failed to create user verification lookup');
            }

            const { error: updateError } = await supabase
                .from('user_profiles')
                .update({
                    verification_id: verificationId,
                })
                .eq('phone_number', phone)
                .single();

            if (updateError && !IsEmptyRowError(updateError)) {
                console.error('Error updating user profile:', updateError);
                throw new Error('Failed to update user profile');
            }

            // Generate JWT token (in production, use proper JWT library)
            const token = `token_${verificationId}_${Date.now()}`;

            res.json({
                success: true,
                message: 'OTP verified successfully',
                token,
                verificationId, // Return verification ID to client
            });
        } catch (error) {
            console.error('Error verifying OTP:', error);
            res.status(500).json({
                success: false,
                errorCode: 'OTP_VERIFICATION_FAILED',
                message: 'Failed to verify OTP',
            });
        }
    })
);

// Clean up expired OTPs periodically
setInterval(() => {
    const now = Date.now();
    for (const [verificationId, verification] of otpStore.entries()) {
        if (now > verification.expiresAt) {
            otpStore.delete(verificationId);
        }
    }
}, 60000); // Check every minute

// Add new endpoint to check verification status
router.post(
    '/check-verification',
    asyncHandler(async (req: Request, res: Response) => {
        const { verificationId } = req.body;

        if (!verificationId) {
            return res.status(400).json({
                success: false,
                message: 'Verification ID is required',
            });
        }

        try {
            const { data: verification, error } = await userProfileService.isValidVerificationId(verificationId);

            if (!verification) {
                return res.status(404).json({
                    success: false,
                    errorCode: 'VERIFICATION_ID_NOT_FOUND',
                    message: 'Verification ID not found',
                });
            }

            // expired
            if (Date.now() > verification.created_at) {
                userProfileService.deleteVerificationIdLookup(verificationId);
                return res.status(404).json({
                    success: false,
                    errorCode: 'VERIFICATION_ID_NOT_FOUND',
                    message: 'Verification ID not found',
                });
            }

            res.json({
                success: true,
                message: 'User is verified',
            });
        } catch (error) {
            console.error('Error checking verification:', error);
            res.status(500).json({
                success: false,
                errorCode: 'VERIFICATION_CHECK_FAILED',
                message: 'Failed to check verification status',
            });
        }
    })
);

// Status endpoint to check SMS service configuration
router.get(
    '/status',
    asyncHandler(async (req: Request, res: Response) => {
        try {
            const status = smsService.getStatus();
            res.json({
                success: true,
                status,
                message: status.awsSnsReady
                    ? 'AWS SNS is ready for SMS delivery'
                    : 'AWS SNS not configured - using console fallback',
            });
        } catch (error) {
            console.error('Error getting status:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get service status',
            });
        }
    })
);

export { router as otpRouter };

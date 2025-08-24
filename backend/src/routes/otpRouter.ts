import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { smsService } from '../services/smsService';
import { IsEmptyRowError, supabase } from '../lib/supabase';
import { userProfileService } from '../services/userProfileService';
import { OtpRefreshRequest, OtpRequest, OtpResponse, OtpVerifyRequest } from '../types/otpTypes';
import jwt from 'jsonwebtoken';
import { REFRESH_SECRET, REFRESH_TTL_SECONDS, requireAuth, sessions, signAccessToken, signRefreshToken } from '../auth/auth';
import bcrypt from 'bcryptjs';

interface OtpStore {
    otp: string;
    createdAt: number;
    expiresAt: number;
}

const router = Router();

// In-memory storage for demo (use database in production)
const otpStore = new Map<string, OtpStore>();

// Generate random 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Clean up expired OTPs periodically
setInterval(() => {
    const now = Date.now();
    for (const [id, value] of otpStore.entries()) {
        if (now > value.expiresAt) {
            otpStore.delete(id);
        }
    }
}, 60000); // Check every minute

// Send OTP endpoint
router.post(
    '/send',
    asyncHandler(async (req: Request, res: Response) => {
        const { phoneNumber } = req.body.request as OtpRequest;

        if (!phoneNumber) {
            const response: OtpResponse = {
                success: false,
                errorCode: "INVALID_PHONE_NUMBER",
                message: 'Phone number is required',
            };
            return res.status(400).json(response);
        }

        try {
            // Generate OTP
            const otp = generateOTP();

            // Send OTP via SMS service (this actually sends the message)
            const smsResult = await smsService.sendOtp(phoneNumber, otp);

            if (smsResult.success) {
                console.log(
                    `✅ OTP ${otp} sent to ${phoneNumber} via ${smsResult.messageId}`
                );

                otpStore.set(phoneNumber, {
                    otp,
                    createdAt: Date.now(),
                    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
                });


                const response: OtpResponse = {
                    success: true,
                    message: 'OTP sent successfully',
                };
                res.json(response);
            } else {
                throw new Error(`SMS delivery failed: ${smsResult.error}`);
            }
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
        const { phoneNumber, code } = req.body.request as OtpVerifyRequest;

        if (!phoneNumber || !code) {
            const response: OtpResponse = {
                success: false,
                errorCode: "INVALID_REQUEST_PARAMS",
                message: 'Phone number and code are required',
            }

            return res.status(400).json(response);
        }

        try {
            const hasOtp = otpStore.has(phoneNumber);
            // Find stored OTP
            const storedOtp = otpStore.get(phoneNumber) as {
                otp: string;
                createdAt: number;
                expiresAt: number; // 5 minutes
            };

            if (!hasOtp || storedOtp === undefined || storedOtp?.otp !== code) {
                const response: OtpResponse = {
                    success: false,
                    errorCode: "INVALID_REQUEST_PARAMS",
                    message: 'Invalid verification code',
                }

                return res.status(400).json(response);
            }

            otpStore.delete(phoneNumber);
            // Check if expired
            if (Date.now() > storedOtp.expiresAt) {
                // Clean up expired OTP
                const response: OtpResponse = {
                    success: false,
                    errorCode: 'OTP_EXPIRED',
                    message: 'Verification code expired',
                }

                return res.status(400).json(response);
            }

            // create the new user profile if it doesn't exist
            const userProfile = await userProfileService.createUniqueProfile(phoneNumber);

            const uid = userProfile?.id;
            // Create a session
            const sessionId = crypto.randomUUID();
            const refreshToken = signRefreshToken(uid, sessionId);
            const refreshHash = await bcrypt.hash(refreshToken, 12);
            const expiresAt = new Date(Date.now() + REFRESH_TTL_SECONDS * 1000);

            sessions.set(sessionId, { sid: sessionId, uid, refreshHash, expiresAt });

            // Issue access token + set refresh cookie
            const accessToken = signAccessToken(sessionId);

            const response: OtpResponse = {
                success: true,
                message: 'OTP verified successfully',
                accessToken,
                refreshToken,
            };

            res.json(response);
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

// Add new endpoint to check verification status
router.get(
    '/auth/is-verified',
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
        const sid = req.body.sid;
        const session = sessions.get(sid);

        if (session === undefined) {
            const response: OtpResponse = {
                success: false,
                errorCode: "UNAUTHORIZED",
                message: 'Unauthorized',
            }
            return res.status(401).json(response);
        }

        const response: OtpResponse = {
            success: true,
            message: 'User is verified',
        };
        res.json(response);
    })
);

router.post("/auth/refresh", async (req, res) => {
    const request = req.body.request as OtpRefreshRequest;

    const refreshToken = request.refreshToken;

    if (!refreshToken) {
        const response: OtpResponse = {
            success: false,
            errorCode: "INVALID_REFRESH_TOKEN",
            message: "Refresh token is invalid",
        }
        return res.status(401).json(response);
    }

    let payload: jwt.JwtPayload;
    try {
        payload = jwt.verify(refreshToken, REFRESH_SECRET) as jwt.JwtPayload;
    } catch {
        return res.sendStatus(401);
    }

    const { sub: userId, sid: sessionId } = payload;
    const uid = userId as string;
    const record = sessions.get(sessionId);
    if (!record) {
        // REUSE DETECTED (token valid signature but session not found)
        // Defensive move: revoke ALL sessions for the user
        for (const [id, s] of sessions) if (s.uid === uid) sessions.delete(id);

        const response: OtpResponse = {
            success: false,
            errorCode: "REFRESH_TOKEN_REUSE_DETECTED",
            message: "Refresh token reuse detected. All sessions revoked.",
        }
        return res.status(401).json(response);
    }

    // Compare hashes (protects if DB leaked)
    const ok = await bcrypt.compare(refreshToken, record.refreshHash);
    if (!ok) {
        // REUSE DETECTED (mismatched token for existing session)
        for (const [id, s] of sessions) if (s.uid === uid) sessions.delete(id);

        const response: OtpResponse = {
            success: false,
            errorCode: "REFRESH_TOKEN_REUSE_DETECTED",
            message: "Refresh token reuse detected. All sessions revoked.",
        }
        return res.status(401).json(response);
    }

    // Rotate: delete old, create new session + new refresh
    sessions.delete(sessionId);

    const newSessionId = crypto.randomUUID();
    const newRefresh = signRefreshToken(uid, newSessionId);
    const newHash = await bcrypt.hash(newRefresh, 12);
    const expiresAt = new Date(Date.now() + REFRESH_TTL_SECONDS * 1000);
    sessions.set(newSessionId, { sid: newSessionId, uid, refreshHash: newHash, expiresAt });

    // New access token + new refresh cookie
    const newAccess = signAccessToken(newSessionId);

    const response: OtpResponse = {
        success: true,
        message: 'Refresh token refreshed successfully',
        accessToken: newAccess,
        refreshToken: newRefresh,
    }
    res.json(response);
});

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

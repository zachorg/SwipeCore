// OTP Service for phone verification
// This service handles OTP sending and verification through your backend
import { OtpCheckVerificationRequest, OtpRequest, OtpResponse, OtpVerifyRequest } from "backend/src/types/otpTypes";

class OtpService {
    private baseUrl: string;

    constructor() {
        // Replace with your actual backend URL
        this.baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
    }

    /**
     * Send OTP to phone number
     */
    async sendOtp(phoneNumber: string): Promise<OtpResponse | null> {
        try {
            const request: OtpRequest = {
                phoneNumber,
            };
            const response = await fetch(`${this.baseUrl}api/otp/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });

            const data = await response.json() as OtpResponse;

            if (!response.ok) {
                throw new Error(data.message || 'Failed to send OTP');
            }

            if (!data.success) {
                throw new Error(data.errorCode || 'Failed to send OTP');
            }

            return data;
        } catch (error: any) {
            console.error('Error sending OTP:', error);
            throw new Error(error.message || 'Failed to send OTP');
        }
    }

    /**
     * Verify OTP code
     */
    async verifyOtp(phoneNumber: string, code: string): Promise<OtpResponse | null> {
        try {
            const request: OtpVerifyRequest = {
                phoneNumber,
                code,
            };
            const response = await fetch(`${this.baseUrl}api/otp/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });

            const data = await response.json() as OtpResponse;

            if (!response.ok) {
                throw new Error(data.message || 'Failed to verify OTP');
            }

            if (!data.success) {
                throw new Error(data.errorCode || 'Failed to verify OTP');
            }

            return data;
        } catch (error: any) {
            console.error('Error verifying OTP:', error);
            throw new Error(error.message || 'Failed to send OTP');
        }
    }

    /**
     * Check verification status using verification ID
     */
    async checkVerification(verificationId: string): Promise<boolean> {
        try {
            const request: OtpCheckVerificationRequest = {
                verificationId,
            };
            const response = await fetch(`${this.baseUrl}api/otp/check-verification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });

            const data = await response.json() as OtpResponse;

            if (!response.ok) {
                throw new Error(data.message || 'Failed to check verification');
            }

            if (!data.success) {
                throw new Error(data.errorCode || 'Failed to check verification');
            }

            return true;
        } catch (error: any) {
            console.error('Error checking verification:', error);
            return false;
        }
    }
}

export const otpService = new OtpService();
export default otpService;

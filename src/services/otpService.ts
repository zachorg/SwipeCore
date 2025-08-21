// OTP Service for phone verification
// This service handles OTP sending and verification through your backend
import { OtpRefreshRequest, OtpRequest, OtpResponse, OtpVerifyRequest } from "backend/src/types/otpTypes";
import verificationService from "./verificationService";

class OtpService {
    private baseUrl: string;

    constructor() {
        // Replace with your actual backend URL
        this.baseUrl = import.meta.env.VITE_BACKEND_URL;
        if (!this.baseUrl) {
            throw new Error('VITE_BACKEND_URL is not set');
        }
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
                body: JSON.stringify({ request }),
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
                body: JSON.stringify({ request }),
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
    async authIsVerified(accessToken: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}api/otp/auth/is-verified`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
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

    async authRefresh(refreshToken: string): Promise<boolean> {
        try {
            const request: OtpRefreshRequest = {
                refreshToken,
            };
            const response = await fetch(`${this.baseUrl}api/otp/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ request }),
            });

            const data = await response.json() as OtpResponse;
            if (!response.ok) {
                throw new Error(data.message || 'Failed to refresh access token');
            }

            if (!data.success) {
                throw new Error(data.errorCode || 'Failed to refresh access token');
            }

            console.log("data", data);
            await verificationService.storeVerification({
                accessToken: data.accessToken,
                refreshToken: data.refreshToken
            });

            return true;
        } catch (error: any) {
            console.error('Error refreshing access token:', error);
            return false;
        }
    }
}

export const otpService = new OtpService();
export default otpService;

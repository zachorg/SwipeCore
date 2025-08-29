// OTP Service for phone verification
// This service handles OTP sending and verification through your backend
import { verificationService } from "./verificationService";
import { API_CONFIG, buildApiUrl } from "../config/api";

// Types for OTP API
export interface OtpRequest {
    phoneNumber: string;
}

export interface OtpVerifyRequest {
    phoneNumber: string;
    code: string;
}

export interface OtpRefreshRequest {
    refreshToken: string;
}

export interface OtpResponse {
    success: boolean;
    message?: string;
    errorCode?: string;
    accessToken?: string;
    refreshToken?: string;
}

class OtpService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = API_CONFIG.BACKEND_URL;

        if (!this.baseUrl) {
            throw new Error('Backend URL is not set');
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

            console.log(`[OTP Service] ${buildApiUrl(API_CONFIG.ENDPOINTS.OTP.SEND)} Sending OTP to: ${phoneNumber}`);

            const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.OTP.SEND), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ request }),
            });

            if (!response.ok) {
                throw new Error(response.statusText || 'Failed to send OTP');
            }

            const data = await response.json() as OtpResponse;

            if (!data.success) {
                throw new Error(data.errorCode || 'Failed to send OTP');
            }

            console.log('[OTP Service] OTP sent successfully');
            return data;
        } catch (error: any) {
            console.error('[OTP Service] Error sending OTP:', error);
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

            console.log('[OTP Service] Verifying OTP for:', phoneNumber);

            const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.OTP.VERIFY), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ request }),
            });

            if (!response.ok) {
                throw new Error(response.statusText || 'Failed to verify OTP');
            }

            const data = await response.json() as OtpResponse;

            if (!data.success) {
                throw new Error(data.errorCode || 'Failed to verify OTP');
            }

            console.log('[OTP Service] OTP verified successfully');
            return data;
        } catch (error: any) {
            console.error('[OTP Service] Error verifying OTP:', error);
            throw new Error(error.message || 'Failed to verify OTP');
        }
    }

    /**
     * Check verification status using verification ID
     */
    async authIsVerified(accessToken: string): Promise<boolean> {
        try {
            const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.OTP.AUTH.IS_VERIFIED), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
            if (!response.ok) {
                throw new Error(response.statusText || 'Failed to check verification');
            }

            const data = await response.json() as OtpResponse;

            if (!data.success) {
                throw new Error(data.errorCode || 'Failed to check verification');
            }

            return true;
        } catch (error: any) {
            console.error('[OTP Service] Error checking verification:', error);
            return false;
        }
    }

    async authRefresh(refreshToken: string): Promise<boolean> {
        try {
            const request: OtpRefreshRequest = {
                refreshToken,
            };

            console.log('[OTP Service] Refreshing access token...');

            const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.OTP.AUTH.REFRESH), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ request }),
            });
            if (!response.ok) {
                throw new Error(response.statusText || 'Failed to check verification');
            }

            const data = await response.json() as OtpResponse;

            if (!data.success) {
                throw new Error(data.errorCode || 'Failed to refresh access token');
            }

            console.log('[OTP Service] Access token refreshed successfully');

            if (data.accessToken && data.refreshToken) {
                await verificationService.storeVerification({
                    accessToken: data.accessToken,
                    refreshToken: data.refreshToken
                });
            }

            return true;
        } catch (error: any) {
            console.error('[OTP Service] Error refreshing access token:', error);
            return false;
        }
    }
}

export const otpService = new OtpService();
export default otpService;

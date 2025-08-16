// OTP Service for phone verification
// This service handles OTP sending and verification through your backend

interface SendOtpResponse {
    success: boolean;
    message: string;
    verificationId?: string;
}

interface VerifyOtpResponse {
    success: boolean;
    message: string;
    token?: string;
    verificationId?: string;
    isNewUser?: boolean;
}

interface CheckVerificationResponse {
    success: boolean;
    message: string;
    user?: any;
}

class OtpService {
    private baseUrl: string;

    constructor() {
        // Replace with your actual backend URL
        this.baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
    }

    /**
     * Send OTP to phone number
     */
    async sendOtp(phoneNumber: string): Promise<SendOtpResponse> {
        try {
            const response = await fetch(`${this.baseUrl}api/otp/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone: phoneNumber }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to send OTP');
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
    async verifyOtp(phoneNumber: string, code: string): Promise<VerifyOtpResponse> {
        try {
            const response = await fetch(`${this.baseUrl}api/otp/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone: phoneNumber, code }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to verify OTP');
            }

            return data;
        } catch (error: any) {
            console.error('Error verifying OTP:', error);
            throw new Error(error.message || 'Failed to verify OTP');
        }
    }

    /**
     * Check verification status using verification ID
     */
    async checkVerification(verificationId: string): Promise<CheckVerificationResponse> {
        try {
            const response = await fetch(`${this.baseUrl}api/otp/check-verification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ verificationId }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to check verification');
            }

            return data;
        } catch (error: any) {
            console.error('Error checking verification:', error);
            throw new Error(error.message || 'Failed to check verification');
        }
    }

    /**
     * Resend OTP to phone number
     */
    async resendOtp(phoneNumber: string): Promise<SendOtpResponse> {
        return this.sendOtp(phoneNumber);
    }
}

export const otpService = new OtpService();
export default otpService;

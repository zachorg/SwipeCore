// SMS Service for sending OTP messages
// This service handles actual SMS delivery via AWS SNS or console fallback

import { awsSnsService } from './awsSnsService';

interface SmsServiceConfig {
    provider: 'aws-sns' | 'console';
}

class SmsService {
    private config: SmsServiceConfig;

    constructor(config: SmsServiceConfig) {
        this.config = config;
    }

    /**
     * Send OTP via SMS
     */
    async sendOtp(phoneNumber: string, otp: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
        try {
            switch (this.config.provider) {
                case 'aws-sns':
                    return await this.sendViaAwsSns(phoneNumber, otp);
                case 'console':
                default:
                    return await this.sendViaConsole(phoneNumber, otp);
            }
        } catch (error: any) {
            console.error('SMS Service Error:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Send via AWS SNS (recommended for production)
     */
    private async sendViaAwsSns(phoneNumber: string, otp: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
        if (!awsSnsService.isReady()) {
            console.warn('⚠️  AWS SNS not ready, falling back to console mode');
            return await this.sendViaConsole(phoneNumber, otp);
        }

        return await awsSnsService.sendOtp(phoneNumber, otp);
    }

    /**
     * Send via Console (development/testing fallback)
     */
    private async sendViaConsole(phoneNumber: string, otp: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
        console.log(`📱 [CONSOLE] SMS to ${phoneNumber}: Your verification code is ${otp}`);
        console.log('💡 This is console mode - no actual SMS sent');
        console.log('💡 Configure AWS SNS for real SMS delivery');

        return {
            success: true,
            messageId: `console_${Date.now()}`,
        };
    }

    /**
     * Get service status
     */
    getStatus() {
        return {
            provider: this.config.provider,
            awsSnsReady: awsSnsService.isReady(),
            awsSnsStatus: awsSnsService.getStatus(),
        };
    }
}

// Create default SMS service with AWS SNS provider
export const smsService = new SmsService({
    provider: 'aws-sns', // Use AWS SNS for real SMS delivery
});

export default smsService;

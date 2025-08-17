// AWS SNS Service for sending SMS messages
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

interface AwsSnsConfig {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
}

class AwsSnsService {
    private client!: SNSClient;
    private isConfigured: boolean = false;

    constructor() {
        // Check if AWS credentials are configured
        if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_REGION) {
            this.client = new SNSClient({
                region: process.env.AWS_REGION,
                credentials: {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                },
            });
            this.isConfigured = true;
            console.log('✅ AWS SNS Service initialized successfully');
        } else {
            console.warn('⚠️  AWS SNS not configured - missing environment variables');
            console.log('💡 Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION');
        }
    }

    /**
     * Send OTP via SMS using AWS SNS
     */
    async sendOtp(phoneNumber: string, otp: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
        if (!this.isConfigured) {
            return {
                success: false,
                error: 'AWS SNS not configured. Please set AWS credentials in environment variables.',
            };
        }

        try {
            // Format phone number for AWS SNS (ensure it starts with +)
            const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

            // Create the SMS message
            const message = `Your SwipeCore verification code is: ${otp}. Valid for 5 minutes.`;

            const command = new PublishCommand({
                Message: message,
                PhoneNumber: formattedPhone,
                MessageAttributes: {
                    'AWS.SNS.SMS.SMSType': {
                        DataType: 'String',
                        StringValue: 'Transactional', // Use Transactional for OTP (higher priority, lower cost)
                    },
                    'AWS.SNS.SMS.MaxPrice': {
                        DataType: 'String',
                        StringValue: '0.01254', // Maximum price per SMS in USD
                    },
                },
            });

            const response = await this.client.send(command);

            console.log(`📱 [AWS SNS] SMS sent to ${formattedPhone}`);
            console.log(`   Message ID: ${response.MessageId}`);

            return {
                success: true,
                messageId: response.MessageId || `aws_${Date.now()}`,
            };
        } catch (error: any) {
            console.error('AWS SNS Error:', error);

            // Handle specific AWS errors
            if (error.name === 'InvalidParameterException') {
                return {
                    success: false,
                    error: 'Invalid phone number format. Please use international format (e.g., +1234567890)',
                };
            } else if (error.name === 'AuthorizationErrorException') {
                return {
                    success: false,
                    error: 'AWS credentials are invalid or expired',
                };
            } else if (error.name === 'ThrottlingException') {
                return {
                    success: false,
                    error: 'Rate limit exceeded. Please try again later',
                };
            }

            return {
                success: false,
                error: error.message || 'Failed to send SMS via AWS SNS',
            };
        }
    }

    /**
     * Check if the service is properly configured
     */
    isReady(): boolean {
        return this.isConfigured;
    }

    /**
     * Get configuration status
     */
    getStatus(): { configured: boolean; region?: string; hasCredentials: boolean } {
        return {
            configured: this.isConfigured,
            region: process.env.AWS_REGION,
            hasCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
        };
    }
}

export const awsSnsService = new AwsSnsService();
export default awsSnsService;

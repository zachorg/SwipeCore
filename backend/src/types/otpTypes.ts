export interface OtpResponse {
    success: boolean;
    message: string;
    errorCode?: string;
    verificationId?: string;
};

export interface OtpRequest {
    phoneNumber: string;
};

export interface OtpVerifyRequest {
    phoneNumber: string;
    code: string;
};

export interface OtpCheckVerificationRequest {
    phoneNumber?: string;
    verificationId?: string;
};

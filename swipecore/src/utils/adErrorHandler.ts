// Ad Error Handling Utility
// Provides comprehensive error handling for ad loading failures

export interface AdError {
    code: string;
    message: string;
    userFriendlyMessage: string;
    retryable: boolean;
    timestamp: number;
    context?: string;
}

export interface AdErrorHandlingConfig {
    maxRetries: number;
    retryDelay: number;
    exponentialBackoff: boolean;
    logErrors: boolean;
}

export class AdErrorHandler {
    private static instance: AdErrorHandler;
    private errorHistory: AdError[] = [];
    private retryCounts: Map<string, number> = new Map();
    private config: AdErrorHandlingConfig;

    private constructor(config: Partial<AdErrorHandlingConfig> = {}) {
        this.config = {
            maxRetries: 3,
            retryDelay: 2000,
            exponentialBackoff: true,
            logErrors: true,
            ...config,
        };
    }

    public static getInstance(config?: Partial<AdErrorHandlingConfig>): AdErrorHandler {
        if (!AdErrorHandler.instance) {
            AdErrorHandler.instance = new AdErrorHandler(config);
        }
        return AdErrorHandler.instance;
    }

    // Categorize common ad errors
    public categorizeError(error: any, context?: string): AdError {
        const errorMessage = error?.message || error?.toString() || 'Unknown error';
        const timestamp = Date.now();

        // Common AdMob error patterns
        if (errorMessage.includes('No fill') || errorMessage.includes('no_fill')) {
            return {
                code: 'NO_FILL',
                message: errorMessage,
                userFriendlyMessage: 'No advertisements available at the moment. Please try again later.',
                retryable: true,
                timestamp,
                context,
            };
        }

        if (errorMessage.includes('Network') || errorMessage.includes('network')) {
            return {
                code: 'NETWORK_ERROR',
                message: errorMessage,
                userFriendlyMessage: 'Network connection issue. Please check your internet connection and try again.',
                retryable: true,
                timestamp,
                context,
            };
        }

        if (errorMessage.includes('Timeout') || errorMessage.includes('timeout')) {
            return {
                code: 'TIMEOUT',
                message: errorMessage,
                userFriendlyMessage: 'Request timed out. Please try again.',
                retryable: true,
                timestamp,
                context,
            };
        }

        if (errorMessage.includes('Invalid') || errorMessage.includes('invalid')) {
            return {
                code: 'INVALID_REQUEST',
                message: errorMessage,
                userFriendlyMessage: 'Invalid advertisement request. Please contact support if this persists.',
                retryable: false,
                timestamp,
                context,
            };
        }

        if (errorMessage.includes('Quota') || errorMessage.includes('quota')) {
            return {
                code: 'QUOTA_EXCEEDED',
                message: errorMessage,
                userFriendlyMessage: 'Advertisement quota exceeded. Please try again later.',
                retryable: true,
                timestamp,
                context,
            };
        }

        // Default error
        return {
            code: 'UNKNOWN_ERROR',
            message: errorMessage,
            userFriendlyMessage: 'Unable to load advertisement. Please try again.',
            retryable: true,
            timestamp,
            context,
        };
    }

    // Record an error
    public recordError(error: any, context?: string): AdError {
        const categorizedError = this.categorizeError(error, context);

        this.errorHistory.push(categorizedError);

        // Keep only last 50 errors to prevent memory issues
        if (this.errorHistory.length > 50) {
            this.errorHistory = this.errorHistory.slice(-50);
        }

        if (this.config.logErrors) {
            console.error('[AdErrorHandler]', {
                code: categorizedError.code,
                message: categorizedError.message,
                context: categorizedError.context,
                timestamp: new Date(categorizedError.timestamp).toISOString(),
            });
        }

        return categorizedError;
    }

    // Check if an error should be retried
    public shouldRetry(errorCode: string, context?: string): boolean {
        const retryCount = this.retryCounts.get(context || 'default') || 0;

        if (retryCount >= this.config.maxRetries) {
            return false;
        }

        const error = this.errorHistory.find(e => e.code === errorCode);
        return error?.retryable || false;
    }

    // Get retry count for a context
    public getRetryCount(context?: string): number {
        return this.retryCounts.get(context || 'default') || 0;
    }

    // Increment retry count
    public incrementRetryCount(context?: string): number {
        const key = context || 'default';
        const currentCount = this.retryCounts.get(key) || 0;
        const newCount = currentCount + 1;
        this.retryCounts.set(key, newCount);
        return newCount;
    }

    // Reset retry count for a context
    public resetRetryCount(context?: string): void {
        this.retryCounts.delete(context || 'default');
    }

    // Calculate retry delay with exponential backoff
    public getRetryDelay(context?: string): number {
        const retryCount = this.getRetryCount(context);

        if (!this.config.exponentialBackoff) {
            return this.config.retryDelay;
        }

        // Exponential backoff: 2^retryCount * baseDelay
        const delay = this.config.retryDelay * Math.pow(2, retryCount);

        // Cap at 30 seconds
        return Math.min(delay, 30000);
    }

    // Get error summary for debugging
    public getErrorSummary(): {
        totalErrors: number;
        recentErrors: number;
        errorCodes: Record<string, number>;
        contexts: Record<string, number>;
    } {
        const now = Date.now();
        const fiveMinutesAgo = now - (5 * 60 * 1000);

        const recentErrors = this.errorHistory.filter(e => e.timestamp > fiveMinutesAgo);

        const errorCodes: Record<string, number> = {};
        const contexts: Record<string, number> = {};

        this.errorHistory.forEach(error => {
            errorCodes[error.code] = (errorCodes[error.code] || 0) + 1;
            if (error.context) {
                contexts[error.context] = (contexts[error.context] || 0) + 1;
            }
        });

        return {
            totalErrors: this.errorHistory.length,
            recentErrors: recentErrors.length,
            errorCodes,
            contexts,
        };
    }

    // Clear error history
    public clearErrors(): void {
        this.errorHistory = [];
        this.retryCounts.clear();
    }

    // Get user-friendly error message
    public getUserFriendlyMessage(errorCode: string): string {
        const error = this.errorHistory.find(e => e.code === errorCode);
        return error?.userFriendlyMessage || 'An unexpected error occurred. Please try again.';
    }

    // Check if there are too many recent errors (potential rate limiting)
    public isRateLimited(): boolean {
        const now = Date.now();
        const oneMinuteAgo = now - (60 * 1000);

        const recentErrors = this.errorHistory.filter(e => e.timestamp > oneMinuteAgo);
        return recentErrors.length >= 10; // More than 10 errors in 1 minute
    }
}

// Export singleton instance
export const adErrorHandler = AdErrorHandler.getInstance();

// Utility functions
export const createAdError = (error: any, context?: string): AdError => {
    return adErrorHandler.recordError(error, context);
};

export const shouldRetryAd = (errorCode: string, context?: string): boolean => {
    return adErrorHandler.shouldRetry(errorCode, context);
};

export const getAdRetryDelay = (context?: string): number => {
    return adErrorHandler.getRetryDelay(context);
};

export const getAdErrorSummary = () => {
    return adErrorHandler.getErrorSummary();
};

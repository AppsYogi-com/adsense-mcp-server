/**
 * Rate limiter for AdSense API
 * 
 * AdSense API limits:
 * - 100 requests per minute per user
 * - 500 requests per minute per project
 * - 10,000 requests per day
 */

const MAX_REQUESTS_PER_MINUTE = 100;
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 32000;

export class RateLimiter {
    private requestTimestamps: number[] = [];

    /**
     * Wait if necessary to stay under rate limit
     */
    async throttle(): Promise<void> {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;

        // Remove old timestamps
        this.requestTimestamps = this.requestTimestamps.filter(
            ts => ts > oneMinuteAgo
        );

        // If we're at the limit, wait until the oldest request expires
        if (this.requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
            const oldestInWindow = this.requestTimestamps[0];
            const waitTime = oldestInWindow + 60000 - now + 100; // Add 100ms buffer
            if (waitTime > 0) {
                await sleep(waitTime);
            }
        }

        // Record this request
        this.requestTimestamps.push(Date.now());
    }

    /**
     * Get current request count in the last minute
     */
    getRequestCount(): number {
        const oneMinuteAgo = Date.now() - 60000;
        return this.requestTimestamps.filter(ts => ts > oneMinuteAgo).length;
    }

    /**
     * Check if we're close to the rate limit
     */
    isNearLimit(): boolean {
        return this.getRequestCount() >= MAX_REQUESTS_PER_MINUTE * 0.8;
    }
}

/**
 * Execute an operation with exponential backoff retry
 */
export async function withRetry<T>(
    operation: () => Promise<T>,
    retries = MAX_RETRIES
): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error;

            const isRateLimited =
                error.code === 429 ||
                error.status === 429 ||
                error.message?.includes('quota') ||
                error.message?.includes('rate limit') ||
                error.message?.includes('RATE_LIMIT_EXCEEDED');

            const isRetryable =
                isRateLimited ||
                error.code === 503 ||
                error.code === 500 ||
                error.status === 503 ||
                error.status === 500 ||
                error.code === 'ECONNRESET' ||
                error.code === 'ETIMEDOUT';

            if (!isRetryable || attempt === retries - 1) {
                throw error;
            }

            // Calculate delay with exponential backoff + jitter
            const delay = Math.min(
                BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 1000,
                MAX_DELAY_MS
            );

            console.error(
                `Request failed (attempt ${attempt + 1}/${retries}), retrying in ${Math.round(delay)}ms...`
            );

            await sleep(delay);
        }
    }

    throw lastError || new Error('Max retries exceeded');
}

/**
 * Sleep helper
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter();

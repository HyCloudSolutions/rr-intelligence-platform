/**
 * Returns the internal backend API URL for server-side calls.
 * On Vercel production, this resolves to the ALB URL.
 * Locally, it falls back to localhost.
 */
export function getBackendUrl(): string {
    // 1. Check for explicitly set env var
    if (process.env.INTERNAL_API_URL) {
        return process.env.INTERNAL_API_URL;
    }
    // 2. Hardcoded production ALB (reliable fallback for Vercel)
    if (process.env.VERCEL || process.env.VERCEL_ENV) {
        return 'http://restaurantrisk-prod-alb-223501911.us-east-1.elb.amazonaws.com';
    }
    // 3. Local development fallback
    return 'http://127.0.0.1:8000';
}

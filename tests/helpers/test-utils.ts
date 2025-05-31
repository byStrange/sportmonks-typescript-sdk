/**
 * Test utility functions
 */

/**
 * Delay execution for a specified number of milliseconds
 * Used for rate limiting in integration tests
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Log rate limit information from API response
 */
export function logRateLimit(response: any): void {
  if (response?.rate_limit) {
    console.log(
      `Rate limit: ${response.rate_limit.remaining}/${response.rate_limit.limit} requests remaining`
    );
    if (response.rate_limit.resets_at) {
      console.log(`Resets at: ${new Date(response.rate_limit.resets_at * 1000).toISOString()}`);
    }
  }
}

/**
 * Generate a random ID for testing
 */
export function randomId(): number {
  return Math.floor(Math.random() * 1000000);
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get date N days from now
 */
export function daysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getToday(): string {
  return formatDate(new Date());
}

/**
 * Get date N days ago in YYYY-MM-DD format
 */
export function getDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDate(date);
}

/**
 * Check if error is a rate limit error
 */
export function isRateLimitError(error: any): boolean {
  return error?.response?.status === 429 || error?.message?.toLowerCase().includes('rate limit');
}

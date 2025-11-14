// src/lib/auth/rateLimiter.ts

/**
 * Client-Side Rate Limiter
 *
 * Prevents too many rapid authentication attempts.
 * This is a UX/security helper - real rate limiting happens on the backend.
 */

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

interface RateLimitState {
  attempts: number[];
  blockedUntil: number | null;
}

const rateLimitState: Map<string, RateLimitState> = new Map();

/**
 * Default rate limit configurations for different operations
 */
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  login: {
    maxAttempts: 5,
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 5 * 60 * 1000, // 5 minutes
  },
  register: {
    maxAttempts: 3,
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 10 * 60 * 1000, // 10 minutes
  },
  refresh: {
    maxAttempts: 10,
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 2 * 60 * 1000, // 2 minutes
  },
};

/**
 * Check if an operation is rate limited
 *
 * @param operation - The operation to check (e.g., 'login', 'register')
 * @returns Object with isAllowed flag and remaining time if blocked
 */
export function checkRateLimit(operation: string): {
  isAllowed: boolean;
  remainingTime?: number;
  message?: string;
} {
  const config = RATE_LIMITS[operation];
  if (!config) {
    // No rate limit configured for this operation
    return { isAllowed: true };
  }

  const now = Date.now();
  let state = rateLimitState.get(operation);

  if (!state) {
    state = { attempts: [], blockedUntil: null };
    rateLimitState.set(operation, state);
  }

  // Check if currently blocked
  if (state.blockedUntil && now < state.blockedUntil) {
    const remainingTime = Math.ceil((state.blockedUntil - now) / 1000);
    return {
      isAllowed: false,
      remainingTime,
      message: `Too many attempts. Please wait ${remainingTime} seconds.`,
    };
  }

  // Clear expired block
  if (state.blockedUntil && now >= state.blockedUntil) {
    state.blockedUntil = null;
    state.attempts = [];
  }

  // Remove attempts outside the time window
  const windowStart = now - config.windowMs;
  state.attempts = state.attempts.filter(time => time > windowStart);

  // Check if limit exceeded
  if (state.attempts.length >= config.maxAttempts) {
    state.blockedUntil = now + config.blockDurationMs;
    const remainingTime = Math.ceil(config.blockDurationMs / 1000);

    console.warn(
      `[Rate Limit] ${operation}: Too many attempts (${state.attempts.length}/${config.maxAttempts}). ` +
      `Blocked for ${remainingTime} seconds.`
    );

    return {
      isAllowed: false,
      remainingTime,
      message: `Too many attempts. Please wait ${remainingTime} seconds before trying again.`,
    };
  }

  // Record this attempt
  state.attempts.push(now);

  return { isAllowed: true };
}

/**
 * Record a successful operation (resets the counter)
 */
export function recordSuccess(operation: string): void {
  const state = rateLimitState.get(operation);
  if (state) {
    state.attempts = [];
    state.blockedUntil = null;
  }
}

/**
 * Manually reset rate limit for an operation
 * Useful for testing or after successful authentication
 */
export function resetRateLimit(operation: string): void {
  rateLimitState.delete(operation);
  console.log(`[Rate Limit] ${operation}: Reset`);
}

/**
 * Get current rate limit status for an operation
 */
export function getRateLimitStatus(operation: string): {
  attempts: number;
  maxAttempts: number;
  isBlocked: boolean;
  remainingTime?: number;
} | null {
  const config = RATE_LIMITS[operation];
  if (!config) return null;

  const state = rateLimitState.get(operation);
  if (!state) {
    return {
      attempts: 0,
      maxAttempts: config.maxAttempts,
      isBlocked: false,
    };
  }

  const now = Date.now();
  const isBlocked = state.blockedUntil !== null && now < state.blockedUntil;
  const remainingTime = isBlocked && state.blockedUntil
    ? Math.ceil((state.blockedUntil - now) / 1000)
    : undefined;

  return {
    attempts: state.attempts.length,
    maxAttempts: config.maxAttempts,
    isBlocked,
    remainingTime,
  };
}

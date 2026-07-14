import rateLimit from 'express-rate-limit';

/**
 * Limits brute-force attempts against auth endpoints (login, OTP, password reset).
 * Keyed by IP; counts only failed/all requests per window.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
});

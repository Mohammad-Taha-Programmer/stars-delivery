const rateLimit = require('express-rate-limit');

const MOBILE_AUTH_WINDOW_MS =
  15 * 60 * 1000;

const MOBILE_LOGIN_ATTEMPT_LIMIT = 10;
const MOBILE_REGISTRATION_ATTEMPT_LIMIT = 5;

const MOBILE_LOGIN_RATE_LIMIT_RESPONSE =
  Object.freeze({
    error:
      'Too many authentication attempts. Please try again later.',
    code: 'AUTH_RATE_LIMITED',
  });

const MOBILE_REGISTRATION_RATE_LIMIT_RESPONSE =
  Object.freeze({
    error:
      'Too many registration attempts. Please try again later.',
    code: 'REGISTRATION_RATE_LIMITED',
  });

function createMobileLoginLimiter() {
  return rateLimit({
    windowMs: MOBILE_AUTH_WINDOW_MS,
    limit: MOBILE_LOGIN_ATTEMPT_LIMIT,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler: (_req, res) =>
      res
        .status(429)
        .json(
          MOBILE_LOGIN_RATE_LIMIT_RESPONSE,
        ),
  });
}

function createMobileRegistrationLimiter() {
  return rateLimit({
    windowMs: MOBILE_AUTH_WINDOW_MS,
    limit:
      MOBILE_REGISTRATION_ATTEMPT_LIMIT,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) =>
      res
        .status(429)
        .json(
          MOBILE_REGISTRATION_RATE_LIMIT_RESPONSE,
        ),
  });
}

module.exports = {
  MOBILE_AUTH_WINDOW_MS,
  MOBILE_LOGIN_ATTEMPT_LIMIT,
  MOBILE_REGISTRATION_ATTEMPT_LIMIT,
  MOBILE_LOGIN_RATE_LIMIT_RESPONSE,
  MOBILE_REGISTRATION_RATE_LIMIT_RESPONSE,
  createMobileLoginLimiter,
  createMobileRegistrationLimiter,
};

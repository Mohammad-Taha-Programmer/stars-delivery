require('dotenv').config();
const { parseAllowedOrigins } = require('./security/originPolicy');

const MIN_SECRET_LENGTH = 32;
const INSECURE_SECRET_VALUES = new Set([
  'stars_delivery_secret_key_2026',
  'tahakum-secret-key-2025',
  'replace-with-a-random-secret-at-least-32-characters',
  'replace-with-a-different-random-secret-at-least-32-chars',
]);

function isPlaceholderSecret(secret) {
  const normalized = secret.toLowerCase();
  return INSECURE_SECRET_VALUES.has(normalized)
    || /^(replace|your|change|example|placeholder|dummy)[-_ ]/.test(normalized)
    || /^(.)(\1){7,}$/.test(normalized);
}

function requiredValue(name, env = process.env) {
  const value = env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function validateSecret(name, value) {
  if (!value || !value.trim()) {
    throw new Error(`${name} is required`);
  }
  const secret = value.trim();
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`${name} must be at least ${MIN_SECRET_LENGTH} characters`);
  }
  if (isPlaceholderSecret(secret)) {
    throw new Error(`${name} must not be a placeholder or known default`);
  }
  return secret;
}

function loadSecurityConfig(env = process.env) {
  const jwtSecret = validateSecret('JWT_SECRET', env.JWT_SECRET);
  const sessionSecret = validateSecret('SESSION_SECRET', env.SESSION_SECRET);
  if (jwtSecret === sessionSecret) {
    throw new Error('JWT_SECRET and SESSION_SECRET must be different');
  }
  return {
    jwtSecret,
    sessionSecret,
  };
}

function loadAppConfig(env = process.env) {
  const security = loadSecurityConfig(env);
  return {
    ...security,
    mongodbUri: requiredValue('MONGODB_URI', env),
    allowedOrigins: parseAllowedOrigins(env.CORS_ALLOWED_ORIGINS || ''),
  };
}

module.exports = {
  MIN_SECRET_LENGTH,
  requiredValue,
  validateSecret,
  loadSecurityConfig,
  loadAppConfig,
};
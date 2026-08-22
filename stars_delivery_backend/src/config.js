require('dotenv').config();

const MIN_SECRET_LENGTH = 32;

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
  return secret;
}

function loadSecurityConfig(env = process.env) {
  return {
    jwtSecret: validateSecret('JWT_SECRET', env.JWT_SECRET),
    sessionSecret: validateSecret('SESSION_SECRET', env.SESSION_SECRET),
  };
}

function loadAppConfig(env = process.env) {
  const security = loadSecurityConfig(env);
  return {
    ...security,
    mongodbUri: requiredValue('MONGODB_URI', env),
  };
}

module.exports = {
  MIN_SECRET_LENGTH,
  requiredValue,
  validateSecret,
  loadSecurityConfig,
  loadAppConfig,
};
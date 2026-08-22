const LEGACY_ADMIN_PASSWORD = 'admin123';
const MIN_ADMIN_PASSWORD_LENGTH = 12;
const INSECURE_ADMIN_PASSWORDS = new Set([
  LEGACY_ADMIN_PASSWORD,
  'do-not-store-a-real-password-here',
  'changeme',
  'change-me',
  'change me',
]);

function isValidAdminPassword(password) {
  const normalized = typeof password === 'string' ? password.trim().toLowerCase() : '';
  return typeof password === 'string'
    && password.length >= MIN_ADMIN_PASSWORD_LENGTH
    && !INSECURE_ADMIN_PASSWORDS.has(normalized)
    && !/^(change|replace|your|example|placeholder|dummy)[-_ ]/.test(normalized);
}

module.exports = { MIN_ADMIN_PASSWORD_LENGTH, isValidAdminPassword };
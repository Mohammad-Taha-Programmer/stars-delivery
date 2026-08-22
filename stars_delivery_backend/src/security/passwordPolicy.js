const LEGACY_ADMIN_PASSWORD = 'admin123';
const MIN_ADMIN_PASSWORD_LENGTH = 12;

function isValidAdminPassword(password) {
  return typeof password === 'string'
    && password.length >= MIN_ADMIN_PASSWORD_LENGTH
    && password !== LEGACY_ADMIN_PASSWORD;
}

module.exports = { MIN_ADMIN_PASSWORD_LENGTH, isValidAdminPassword };